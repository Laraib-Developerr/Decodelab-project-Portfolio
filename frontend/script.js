// ===========================================================
// LARAIB — Portfolio Script
// Handles: page/section navigation, profession tabs, scroll
// animations, mobile menu, the Hire Me contact form, and the
// footer Guestbook (all backed by the PHP + MySQL API).
// ===========================================================
(function () {
  'use strict';

  // -----------------------------------------------------------
  // CONFIG — relative path to the PHP API.
  // On InfinityFree, upload the backend/api/ folder as htdocs/api/
  // (a sibling of index.html) and this relative path just works.
  // For local testing with PHP's built-in server, run:
  //   php -S localhost:8000  (from the folder that contains api/)
  // -----------------------------------------------------------
  var API_BASE = 'api';

  // Local cache of { commentId: editToken } so only the browser
  // that posted a comment sees Edit/Delete controls for it.
  var GB_TOKEN_KEY = 'gbTokens';

  var navButtons = document.querySelectorAll('.nav-btn[data-page]');
  var pageSections = document.querySelectorAll('.page-section');
  var menuToggle = document.getElementById('menuToggle');
  var navMenu = document.getElementById('navMenu');

  function showPage(pageId, scrollTop) {
    pageSections.forEach(function (sec) {
      sec.classList.toggle('active', sec.id === pageId);
    });
    navButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-page') === pageId);
    });
    if (scrollTop !== false) {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
    navMenu.classList.remove('open');
    menuToggle.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    refreshObserver();
  }

  // Nav clicks (also used by in-page CTA buttons with data-page)
  document.querySelectorAll('[data-page]').forEach(function (el) {
    el.addEventListener('click', function () {
      var target = el.getAttribute('data-page');
      showPage(target);
    });
  });

  // Mobile menu toggle
  menuToggle.addEventListener('click', function () {
    var isOpen = navMenu.classList.toggle('open');
    menuToggle.classList.toggle('open', isOpen);
    menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });

  // Profession tabs
  var tabButtons = document.querySelectorAll('.tab-btn[data-sub]');
  var subSections = document.querySelectorAll('.sub-section');

  function showSub(subId) {
    subSections.forEach(function (sub) {
      sub.classList.toggle('active', sub.id === subId);
    });
    tabButtons.forEach(function (btn) {
      btn.classList.toggle('active', btn.getAttribute('data-sub') === subId);
    });
    refreshObserver();
  }

  tabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      showSub(btn.getAttribute('data-sub'));
    });
  });

  // Home work-card click -> go to profession + scroll to subsection
  document.querySelectorAll('.work-card[data-section]').forEach(function (card) {
    card.addEventListener('click', function () {
      var subId = card.getAttribute('data-section');
      showPage('profession', false);
      showSub(subId);
      requestAnimationFrame(function () {
        var target = document.getElementById(subId);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  });

  // IntersectionObserver fly-in animations
  var observer;
  function refreshObserver() {
    if (observer) observer.disconnect();
    observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.page-section.active .fly, .sub-section.active .fly').forEach(function (el) {
      if (!el.classList.contains('in-view')) {
        observer.observe(el);
      }
    });
  }

  refreshObserver();

  // -----------------------------------------------------------
  // HIRE ME FORM — POSTs to the backend /api/contact endpoint.
  // No mailto: fallback; success/error state shown inline.
  // -----------------------------------------------------------
  var hireForm = document.getElementById('hireForm');
  var formStatus = document.getElementById('formStatus');
  var submitBtn = document.getElementById('hireSubmitBtn');

  function setStatus(message, type) {
    formStatus.textContent = message;
    formStatus.className = 'form-status show ' + type;
  }

  function clearStatus() {
    formStatus.textContent = '';
    formStatus.className = 'form-status';
  }

  function isValidEmail(value) {
    // Simple, permissive syntactic check — the backend re-validates.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  if (hireForm) {
    hireForm.addEventListener('submit', function (event) {
      event.preventDefault();
      clearStatus();

      var name = hireForm.name.value.trim();
      var email = hireForm.email.value.trim();
      var message = hireForm.message.value.trim();

      if (!name || !email || !message) {
        setStatus('Please fill in every field before sending.', 'error');
        return;
      }
      if (!isValidEmail(email)) {
        setStatus('That email address doesn\'t look right — please check it.', 'error');
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending…';
      setStatus('Sending your message…', 'loading');

      fetch(API_BASE + '/contact_create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, email: email, message: message })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, status: response.status, data: data };
          });
        })
        .then(function (result) {
          if (result.ok) {
            setStatus('Thanks, ' + name.split(' ')[0] + '! Your message is in — I\'ll reply soon.', 'success');
            hireForm.reset();
          } else {
            var msg = (result.data && result.data.message) || 'Something went wrong. Please try again.';
            setStatus(msg, 'error');
          }
        })
        .catch(function () {
          setStatus('Could not reach the server. Check your connection and try again.', 'error');
        })
        .finally(function () {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Send Message →';
        });
    });
  }

  // -----------------------------------------------------------
  // GUESTBOOK — Create, Read, Update, Delete comments in the footer.
  // Ownership model: on create, the server returns a one-time
  // edit_token. We keep it in localStorage keyed by comment id, so
  // only the browser that posted a comment can edit/delete it later.
  // The token itself is never returned by the read endpoint.
  // -----------------------------------------------------------
  var gbForm = document.getElementById('guestbookForm');
  var gbList = document.getElementById('guestbookList');
  var gbStatus = document.getElementById('gbFormStatus');
  var gbSubmitBtn = document.getElementById('gbSubmitBtn');

  function getGbTokens() {
    try {
      return JSON.parse(localStorage.getItem(GB_TOKEN_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  function saveGbToken(id, token) {
    var tokens = getGbTokens();
    tokens[id] = token;
    localStorage.setItem(GB_TOKEN_KEY, JSON.stringify(tokens));
  }

  function removeGbToken(id) {
    var tokens = getGbTokens();
    delete tokens[id];
    localStorage.setItem(GB_TOKEN_KEY, JSON.stringify(tokens));
  }

  function setGbStatus(message, type) {
    if (!gbStatus) return;
    gbStatus.textContent = message;
    gbStatus.className = 'form-status show ' + type;
  }

  function clearGbStatus() {
    if (!gbStatus) return;
    gbStatus.textContent = '';
    gbStatus.className = 'form-status';
  }

  function formatGbDate(isoString) {
    var d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function renderComments(comments) {
    if (!comments.length) {
      gbList.innerHTML = '<p class="guestbook-empty">No comments yet — be the first to say hi.</p>';
      return;
    }

    var tokens = getGbTokens();

    gbList.innerHTML = comments.map(function (c) {
      var isOwner = Object.prototype.hasOwnProperty.call(tokens, String(c.id));
      var actionsHtml = isOwner
        ? '<div class="comment-actions">' +
          '<button type="button" class="comment-edit-btn" data-id="' + c.id + '">Edit</button>' +
          '<button type="button" class="comment-delete-btn" data-id="' + c.id + '">Delete</button>' +
          '</div>'
        : '';

      return (
        '<div class="comment-card" data-id="' + c.id + '">' +
          '<div class="comment-head">' +
            '<strong class="comment-name">' + escapeHtml(c.name) + '</strong>' +
            '<span class="comment-date">' + formatGbDate(c.created_at) + '</span>' +
          '</div>' +
          '<p class="comment-body">' + escapeHtml(c.comment) + '</p>' +
          actionsHtml +
        '</div>'
      );
    }).join('');

    attachCommentActionListeners();
  }

  function loadComments() {
    gbList.innerHTML = '<p class="guestbook-loading">Loading comments…</p>';
    fetch(API_BASE + '/comments_read.php')
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (result.status === 'success') {
          renderComments(result.data);
        } else {
          gbList.innerHTML = '<p class="guestbook-empty">Could not load comments right now.</p>';
        }
      })
      .catch(function () {
        gbList.innerHTML = '<p class="guestbook-empty">Could not reach the server.</p>';
      });
  }

  function attachCommentActionListeners() {
    gbList.querySelectorAll('.comment-edit-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        startEditComment(btn.getAttribute('data-id'));
      });
    });
    gbList.querySelectorAll('.comment-delete-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        deleteComment(btn.getAttribute('data-id'));
      });
    });
  }

  function startEditComment(id) {
    var card = gbList.querySelector('.comment-card[data-id="' + id + '"]');
    if (!card) return;
    var bodyEl = card.querySelector('.comment-body');
    var currentText = bodyEl.textContent;

    card.querySelector('.comment-actions').style.display = 'none';
    bodyEl.style.display = 'none';

    var editWrap = document.createElement('div');
    editWrap.className = 'comment-edit-wrap';
    editWrap.innerHTML =
      '<textarea class="comment-edit-textarea" maxlength="1000">' + escapeHtml(currentText) + '</textarea>' +
      '<div class="comment-actions">' +
        '<button type="button" class="comment-save-btn" data-id="' + id + '">Save</button>' +
        '<button type="button" class="comment-cancel-btn" data-id="' + id + '">Cancel</button>' +
      '</div>';
    card.appendChild(editWrap);

    editWrap.querySelector('.comment-save-btn').addEventListener('click', function () {
      var newText = editWrap.querySelector('.comment-edit-textarea').value.trim();
      if (newText.length < 2) return;
      saveEditComment(id, newText);
    });
    editWrap.querySelector('.comment-cancel-btn').addEventListener('click', function () {
      editWrap.remove();
      bodyEl.style.display = '';
      card.querySelector('.comment-actions').style.display = '';
    });
  }

  function saveEditComment(id, newComment) {
    var tokens = getGbTokens();
    var token = tokens[id];
    if (!token) return;

    fetch(API_BASE + '/comments_update.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, edit_token: token, comment: newComment })
    })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (result.status === 'success') {
          loadComments();
        } else {
          alert(result.message || 'Could not update your comment.');
        }
      })
      .catch(function () {
        alert('Could not reach the server.');
      });
  }

  function deleteComment(id) {
    var tokens = getGbTokens();
    var token = tokens[id];
    if (!token) return;
    if (!window.confirm('Delete this comment?')) return;

    fetch(API_BASE + '/comments_delete.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: id, edit_token: token })
    })
      .then(function (response) { return response.json(); })
      .then(function (result) {
        if (result.status === 'success') {
          removeGbToken(id);
          loadComments();
        } else {
          alert(result.message || 'Could not delete your comment.');
        }
      })
      .catch(function () {
        alert('Could not reach the server.');
      });
  }

  if (gbForm) {
    gbForm.addEventListener('submit', function (event) {
      event.preventDefault();
      clearGbStatus();

      var name = gbForm.name.value.trim();
      var comment = gbForm.comment.value.trim();

      if (!name || !comment) {
        setGbStatus('Please add your name and a comment.', 'error');
        return;
      }

      gbSubmitBtn.disabled = true;
      gbSubmitBtn.textContent = 'Posting…';

      fetch(API_BASE + '/comments_create.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, comment: comment })
      })
        .then(function (response) {
          return response.json().then(function (data) {
            return { ok: response.ok, data: data };
          });
        })
        .then(function (result) {
          if (result.ok && result.data.status === 'success') {
            saveGbToken(result.data.data.id, result.data.data.edit_token);
            gbForm.reset();
            setGbStatus('Comment posted!', 'success');
            loadComments();
          } else {
            setGbStatus((result.data && result.data.message) || 'Could not post your comment.', 'error');
          }
        })
        .catch(function () {
          setGbStatus('Could not reach the server. Check your connection and try again.', 'error');
        })
        .finally(function () {
          gbSubmitBtn.disabled = false;
          gbSubmitBtn.textContent = 'Post Comment';
        });
    });

    loadComments();
  }
})();
