// НАЧАЛЬНЫЕ ДАННЫЕ ПОСТОВ
const INITIAL_POSTS = [
  {
    id: 'p1',
    type: '🌱 Отдам',
    title: 'Двор напротив',
    text: 'Отдам даром рассаду томатов и базилика. Стоит у скамейки, 6 подъезд.',
    dist: 90,
    timeText: 'гаснет через 1 ч 40 мин',
    responses: 3,
    x: 26, y: 18, // координаты на радаре (%)
    isFav: false
  },
  {
    id: 'p2',
    type: '🔁 Одолжить',
    title: 'Сосед из 42 квартиры',
    text: 'Кто одолжит штопор на десять минут? Открываю вино, а он потерялся.',
    dist: 210,
    timeText: 'гаснет через 0 ч 35 мин',
    responses: 1,
    x: 80, y: 38,
    isFav: true
  },
  {
    id: 'p3',
    type: '❓ Вопрос',
    title: 'Сосед сверху',
    text: 'У кого горит свет в доме напротив в 3 часа ночи вторую неделю? Просто любопытно, всё ли в порядке.',
    dist: 160,
    timeText: 'гаснет через 1 ч 58 мин',
    responses: 5,
    x: 18, y: 82,
    isFav: false
  },
  {
    id: 'p4',
    type: '🔁 Одолжить',
    title: 'Твой подъезд',
    text: 'Нужна стремянка на 20 минут, повесить шторы.',
    dist: 300,
    timeText: 'гаснет через 12 мин',
    responses: 0,
    x: 75, y: 78,
    isFav: false
  }
];

// СОСТОЯНИЕ ПРИЛОЖЕНИЯ
let state = {
  posts: [...INITIAL_POSTS],
  currentUser: null, // { phone: '+79001234567', windowNum: 1 }
  activeRadarFilter: 'all',
  activeFeedFilter: 'all',
  radarRadius: 500, // метры
  notifsEnabled: true,
  radarVisible: true,
  authMode: 'login' // 'login' или 'register'
};

// ИНИЦИАЛИЗАЦИЯ ПРИ ЗАГРУЗКЕ
document.addEventListener('DOMContentLoaded', () => {
  initClock();
  initNavigation();
  initFilters();
  initCreateForm();
  initAuthModal();
  renderApp();
});

// ЧАСЫ В СТАТУСБАРЕ
function initClock() {
  const clockEl = document.getElementById('clock');
  const updateTime = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    clockEl.textContent = `${h}:${m}`;
  };
  updateTime();
  setInterval(updateTime, 10000);
}

// НАВИГАЦИЯ МЕЖДУ ЭКРАНАМИ
function initNavigation() {
  const navItems = document.querySelectorAll('.navbar .item');
  navItems.forEach(item => {
    item.addEventListener('click', () => {
      const targetId = item.getAttribute('data-target');
      
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
      document.getElementById(targetId).classList.add('active');
    });
  });
}

// РЕНДЕРИНГ ВСЕХ ЧАСТЕЙ ПРИЛОЖЕНИЯ
function renderApp() {
  renderRadar();
  renderFeed();
  renderProfile();
}

// 1. РЕНДЕР РАДАРА
function renderRadar() {
  const stage = document.getElementById('radar-stage');
  const cardsContainer = document.getElementById('radar-cards');
  const noteEl = document.getElementById('radar-note');
  const tipEl = document.getElementById('radar-tip');

  // Удаляем старые точки соседей
  stage.querySelectorAll('.neighbor').forEach(n => n.remove());

  // Фильтрация постов
  let filtered = state.posts.filter(p => p.dist <= state.radarRadius);
  if (state.activeRadarFilter !== 'all') {
    filtered = filtered.filter(p => p.type === state.activeRadarFilter);
  }

  // Отрисовка точек на радаре
  filtered.forEach(post => {
    const dot = document.createElement('div');
    let colorClass = '';
    if (post.type === '🌱 Отдам') colorClass = 'moss';
    if (post.type === '❓ Вопрос') colorClass = 'slate';

    dot.className = `neighbor ${colorClass}`;
    dot.style.left = `${post.x}%`;
    dot.style.top = `${post.y}%`;
    dot.title = `${post.type}: ${post.text}`;

    dot.addEventListener('click', () => openPostModal(post));
    stage.appendChild(dot);
  });

  // Обновление подсказки
  if (filtered.length > 0) {
    tipEl.textContent = filtered[0].text;
  } else {
    tipEl.textContent = 'В этом радиусе пока тишина...';
  }

  // Отрисовка карточек под радаром
  cardsContainer.innerHTML = '';
  filtered.slice(0, 3).forEach(post => {
    const card = document.createElement('article');
    card.className = 'card';
    
    let btnClass = '';
    let btnText = 'Посмотреть';
    if (post.type === '🌱 Отдам') { btnClass = 'moss'; btnText = 'Забрать'; }
    if (post.type === '🔁 Одолжить') { btnText = 'Помочь'; }
    if (post.type === '❓ Вопрос') { btnClass = 'slate'; btnText = 'Ответить'; }

    card.innerHTML = `
      <h3>${post.title} (${post.dist} м)</h3>
      <p>${post.text}</p>
      <button class="btn ${btnClass}">${btnText}</button>
    `;
    card.querySelector('button').addEventListener('click', () => openPostModal(post));
    cardsContainer.appendChild(card);
  });

  // Текст сноски
  noteEl.textContent = `${filtered.length} окон светятся в радиусе ${state.radarRadius} м. Ты — тоже просто окно на этой карте.`;
  document.getElementById('radar-radius-label').textContent = `${state.radarRadius} м`;
}

// 2. РЕНДЕР ЛЕНТЫ
function renderFeed() {
  const feedList = document.getElementById('feed-list');
  const subEl = document.getElementById('feed-count-sub');

  let filtered = state.posts;
  if (state.activeFeedFilter !== 'all') {
    filtered = filtered.filter(p => p.type === state.activeFeedFilter);
  }

  subEl.textContent = `${filtered.length} сообщения · обновляется само`;
  feedList.innerHTML = '';

  filtered.forEach(post => {
    const isAlmost = post.timeText.includes('мин') && parseInt(post.timeText) < 20;
    
    let chipClass = 'active';
    if (post.type === '🌱 Отдам') chipClass = 'moss';
    if (post.type === '❓ Вопрос') chipClass = 'slate';

    const postEl = document.createElement('div');
    postEl.className = 'swipe-wrap';
    postEl.innerHTML = `
      <div class="swipe-actions">
        <div class="fav" id="swipe-fav-${post.id}">
          <span class="star">${post.isFav ? '★' : '☆'}</span>
          <span>${post.isFav ? 'В избранном' : 'В избранное'}</span>
        </div>
      </div>
      <div class="post post-interactive ${isAlmost ? 'almost' : ''}">
        <div class="toprow">
          <span class="chip ${chipClass}">${post.type}</span>
          <span class="dist">~${post.dist} м</span>
        </div>
        <p class="txt">${post.text}</p>
        <div class="meta">
          <span>${post.responses} отклика</span>
          <span class="${isAlmost ? 'fade' : ''}">${post.timeText}</span>
        </div>
        <div class="post-actions-row">
          <button class="action-btn respond-btn">💬 Откликнуться</button>
          <button class="action-btn fav-btn ${post.isFav ? 'fav-active' : ''}">
            ${post.isFav ? '★ В избранном' : '☆ В избранное'}
          </button>
        </div>
      </div>
    `;

    // Интерактив кнопок поста
    const postCard = postEl.querySelector('.post-interactive');
    postCard.querySelector('.respond-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      openPostModal(post);
    });

    const favBtn = postCard.querySelector('.fav-btn');
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleFavorite(post.id);
    });

    postEl.querySelector('.fav').addEventListener('click', () => {
      toggleFavorite(post.id);
    });

    feedList.appendChild(postEl);
  });
}

// 3. РЕНДЕР ПРОФИЛЯ
function renderProfile() {
  const nameEl = document.getElementById('profile-name');
  const authActionBtn = document.getElementById('auth-action-btn');
  const favCountEl = document.getElementById('favs-count-badge');
  const statFavs = document.getElementById('stat-favs');
  const statPosts = document.getElementById('stat-posts');

  const favsCount = state.posts.filter(p => p.isFav).length;
  favCountEl.textContent = favsCount;
  statFavs.textContent = favsCount;

  const myPostsCount = state.posts.filter(p => p.isMine).length;
  statPosts.textContent = myPostsCount;

  if (state.currentUser) {
    nameEl.textContent = `Окно (${state.currentUser.phone.slice(-4)})`;
    authActionBtn.className = 'row danger';
    authActionBtn.innerHTML = `
      <div class="left"><span class="ico">⏻</span>Выйти из аккаунта</div>
      <div class="val"><span class="chev">›</span></div>
    `;
    authActionBtn.onclick = logout;
  } else {
    nameEl.textContent = 'Гость (Окно №1)';
    authActionBtn.className = 'row';
    authActionBtn.innerHTML = `
      <div class="left"><span class="ico">🔑</span>Войти / Зарегистрироваться</div>
      <div class="val"><span class="chev">›</span></div>
    `;
    authActionBtn.onclick = () => openAuthModal('login');
  }

  document.getElementById('radius-val-display').textContent = `${state.radarRadius} м`;
}

// ИЗБРАННОЕ
function toggleFavorite(postId) {
  const post = state.posts.find(p => p.id === postId);
  if (post) {
    post.isFav = !post.isFav;
    showToast(post.isFav ? 'Сохранено в избранное' : 'Удалено из избранного');
    renderApp();
  }
}

// ФИЛЬТРЫ И ПЕРЕКЛЮЧАТЕЛИ
function initFilters() {
  // Фильтры радара
  document.querySelectorAll('.quick-row .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.quick-row .chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      state.activeRadarFilter = btn.getAttribute('data-filter');
      renderRadar();
    });
  });

  // Фильтры ленты
  document.querySelectorAll('.feed-filters .chip').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.feed-filters .chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      state.activeFeedFilter = btn.getAttribute('data-feed-filter');
      renderFeed();
    });
  });

  // Кнопка обновления ленты
  document.getElementById('refresh-feed-btn').addEventListener('click', () => {
    showToast('Лента обновлена');
    renderFeed();
  });

  // Радиус в профиле
  document.getElementById('change-radius-btn').addEventListener('click', () => {
    const radiuses = [300, 500, 1000];
    const nextIdx = (radiuses.indexOf(state.radarRadius) + 1) % radiuses.length;
    state.radarRadius = radiuses[nextIdx];
    showToast(`Радиус обзора: ${state.radarRadius} метров`);
    renderApp();
  });

  // Тогглы профиля
  document.getElementById('toggle-notifs').addEventListener('click', function() {
    this.classList.toggle('active');
    state.notifsEnabled = this.classList.contains('active');
    showToast(state.notifsEnabled ? 'Уведомления включены' : 'Уведомления выключены');
  });

  document.getElementById('toggle-radar').addEventListener('click', function() {
    this.classList.toggle('active');
    state.radarVisible = this.classList.contains('active');
    showToast(state.radarVisible ? 'Вы видны на радаре' : 'Вы скрыты с радара');
  });
}

// 4. СОЗДАНИЕ ПУБЛИКАЦИИ
function initCreateForm() {
  const form = document.getElementById('create-post-form');
  const textarea = document.getElementById('post-text');
  const counter = document.getElementById('char-counter');
  const typeOpts = document.querySelectorAll('.type-opt');

  let selectedType = '🔁 Одолжить';

  textarea.addEventListener('input', () => {
    counter.textContent = textarea.value.length;
  });

  typeOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      typeOpts.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedType = opt.getAttribute('data-type');
    });
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = textarea.value.trim();
    const ttlHours = document.getElementById('post-ttl').value;

    if (!text) return;

    const newPost = {
      id: 'p_' + Date.now(),
      type: selectedType,
      title: 'Твоё окно',
      text: text,
      dist: 0,
      timeText: `гаснет через ${ttlHours} ч 00 мин`,
      responses: 0,
      x: 45 + Math.random() * 10,
      y: 45 + Math.random() * 10,
      isFav: false,
      isMine: true
    };

    state.posts.unshift(newPost);
    textarea.value = '';
    counter.textContent = '0';

    showToast('Окно зажглось! Сообщение на карте.');
    renderApp();

    // Переход на радар
    document.querySelector('.navbar .item[data-target="screen-radar"]').click();
  });
}

// 5. МОДАЛЬНОЕ ОКНО АВТОРИЗАЦИИ
function initAuthModal() {
  const modal = document.getElementById('auth-modal');
  const closeBtn = document.getElementById('modal-close-btn');
  const sendCodeBtn = document.getElementById('send-code-btn');
  const verifyCodeBtn = document.getElementById('verify-code-btn');
  const backBtn = document.getElementById('back-to-phone-btn');
  const switchAuth = document.getElementById('switch-auth-mode');
  const phoneInput = document.getElementById('phone-input');

  closeBtn.onclick = () => modal.classList.remove('active');

  switchAuth.onclick = () => {
    state.authMode = state.authMode === 'login' ? 'register' : 'login';
    updateAuthModalText();
  };

  sendCodeBtn.onclick = () => {
    const phone = phoneInput.value.trim();
    if (phone.length < 7) {
      showToast('Введите корректный номер телефона');
      return;
    }
    document.getElementById('display-phone-num').textContent = '+7 ' + phone;
    document.getElementById('auth-step-phone').style.display = 'none';
    document.getElementById('auth-step-code').style.display = 'block';
    showToast('Код отправлен: 1234');
  };

  backBtn.onclick = () => {
    document.getElementById('auth-step-code').style.display = 'none';
    document.getElementById('auth-step-phone').style.display = 'block';
  };

  verifyCodeBtn.onclick = () => {
    const code = document.getElementById('code-input').value.trim();
    if (code === '1234' || code.length === 4) {
      state.currentUser = {
        phone: '+7 ' + phoneInput.value
      };
      modal.classList.remove('active');
      showToast('С возвращением на карту!');
      renderApp();
    } else {
      showToast('Неверный код! Попробуйте 1234');
    }
  };
}

function openAuthModal(mode = 'login') {
  state.authMode = mode;
  updateAuthModalText();
  document.getElementById('auth-step-phone').style.display = 'block';
  document.getElementById('auth-step-code').style.display = 'none';
  document.getElementById('auth-modal').classList.add('active');
}

function updateAuthModalText() {
  const title = document.getElementById('auth-title');
  const lead = document.getElementById('auth-lead');
  const switchText = document.getElementById('switch-auth-mode');

  if (state.authMode === 'login') {
    title.textContent = 'С возвращением';
    lead.textContent = 'Твоё окно помнит эту улицу. Подтверди номер — и вернёшься на карту.';
    switchText.innerHTML = 'Ещё не был здесь? <b>Зарегистрироваться</b>';
  } else {
    title.textContent = 'Стань окном на карте';
    lead.textContent = 'Без имени, без фото — просто светом в нужный момент, когда рядом кому-то что-то нужно.';
    switchText.innerHTML = 'Уже светишься здесь? <b>Войти</b>';
  }
}

function logout() {
  state.currentUser = null;
  showToast('Вы вышли из системы');
  renderApp();
}

// 6. МОДАЛЬНОЕ ОКНО ПОСТА
function openPostModal(post) {
  const modal = document.getElementById('post-modal');
  const content = document.getElementById('post-modal-content');
  const closeBtn = document.getElementById('post-modal-close');

  let chipClass = 'active';
  if (post.type === '🌱 Отдам') chipClass = 'moss';
  if (post.type === '❓ Вопрос') chipClass = 'slate';

  content.innerHTML = `
    <div style="margin-bottom:12px;">
      <span class="chip ${chipClass}">${post.type}</span>
      <span style="font-size:12px; color:var(--text-faint); margin-left:8px;">${post.dist} м от тебя</span>
    </div>
    <h3 style="font-family:'Fraunces',serif; font-size:18px; margin:0 0 10px;">${post.title}</h3>
    <p style="font-size:14px; line-height:1.5; color:var(--text); margin-bottom:16px;">${post.text}</p>
    
    <div class="field-label" style="margin-top:14px;">Откликнуться анонимно</div>
    <textarea id="response-msg" placeholder="Напишите ответ соседу..." style="min-height:80px; margin-top:6px;"></textarea>
    
    <button class="cta-btn primary" id="send-response-btn" style="margin-top:12px;">Отправить сообщение</button>
  `;

  closeBtn.onclick = () => modal.classList.remove('active');

  content.querySelector('#send-response-btn').onclick = () => {
    const msg = content.querySelector('#response-msg').value.trim();
    if (msg) {
      post.responses++;
      modal.classList.remove('active');
      showToast('Отклик отправлен соседу!');
      renderApp();
    } else {
      showToast('Введите текст отклика');
    }
  };

  modal.classList.add('active');
}

// ВСПОМОГАТЕЛЬНЫЕ TOAST-УВЕДОМЛЕНИЯ
function showToast(text) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `<span>💡</span> <span>${text}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}