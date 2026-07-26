import { StrictMode, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Menu, MoveUpRight, Quote, Star, X, Sparkles, Utensils, Activity, ShieldAlert } from 'lucide-react';
import { createRoot } from 'react-dom/client';
import { useInViewAnimation } from './hooks/useInViewAnimation';
import './styles.css';
import './cinematic-mobile.css';

const gallery = [
  ...Array.from({ length: 36 }, (_, index) => `/gallery/inbound/${String(index + 1).padStart(2, '0')}.jpg`),
];
const testimonials = [
  ['Участница марафона', 'Результат требует подтверждения', 'За время программы минус 6 кг и это без голода! Наталья всегда на связи, поддерживает и мотивирует в самые сложные моменты.', 'М'],
  ['Участница марафона', 'Результат требует подтверждения', 'Я уже пробовала кучу диет, но здесь совсем другой подход. Наставник реально помогает, и ты не бросаешь на полпути.', 'А'],
  ['Участница марафона', 'Результат требует подтверждения', 'Это не просто диета — это образ жизни. После марафона стало намного понятнее, как собирать рацион и не возвращаться к хаосу.', 'Е'],
  ['Участница марафона', 'Результат требует подтверждения', 'Программа прошла на одном дыхании! Наталья каждый день на связи, всегда ответит и поддержит.', 'О'],
  ['Участница марафона', 'Результат требует подтверждения', 'Никогда не думала, что смогу похудеть без жёстких ограничений. Меню вкусное, а поддержка помогает держать темп.', 'И'],
];
const stages = [
  ['Понять свою норму', 'Разбираем текущий рацион, рассчитываем КБЖУ и учимся видеть в еде белки, жиры, углеводы и клетчатку.', 'Твоя точка старта · Порции · Голод и сытость'],
  ['Собирать тарелку', 'Осваиваем понятную формулу тарелки и варианты замен: сегодня картофель, завтра гречка или макароны — без чувства, что план нарушен.', 'Белок · Гарнир · Овощи · Заправка'],
  ['Выбирать самостоятельно', 'Закрепляем навык на обычной еде, в магазине, кафе и дома, чтобы после марафона не зависеть от готовой таблицы меню.', 'Практика · Обратная связь · Своя система'],
];
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzRC5ecCQjBHqfLDxxAUAxqiXRTfRDAz71qEyGXNa5aUwCYxs7prjCTc1CBCWtOEIRf/exec';

function Reveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const animation = useInViewAnimation();
  return <div ref={animation.ref} className={`${animation.className} ${className}`} style={{ animationDelay: `${delay}s` }}>{children}</div>;
}
function ParallaxImage() {
  const ref = useRef<HTMLDivElement>(null); const frame = useRef(0); const [offset, setOffset] = useState(0); const [active, setActive] = useState(false);
  useEffect(() => { if (!ref.current) return; const observer = new IntersectionObserver(([entry]) => setActive(entry.isIntersecting), { threshold: .1 }); observer.observe(ref.current); return () => observer.disconnect(); }, []);
  useEffect(() => { const onScroll = () => { cancelAnimationFrame(frame.current); frame.current = requestAnimationFrame(() => { if (active && ref.current) { const r = ref.current.getBoundingClientRect(); setOffset(Math.max(-200, Math.min(200, (innerHeight / 2 - r.top) * .2))); } }); }; addEventListener('scroll', onScroll, { passive: true }); onScroll(); return () => { cancelAnimationFrame(frame.current); removeEventListener('scroll', onScroll); }; }, [active]);
  return <div ref={ref} className="parallax-frame"><img src="https://images.unsplash.com/photo-1556911220-bff31c812dba?auto=format&fit=crop&w=1000&q=85" alt="Наталья готовит полезное блюдо" style={{ transform: `translateY(${offset}px) scale(1.08)` }} /></div>;
}
function CinematicHero() {
  const videoRef = useRef<HTMLVideoElement>(null); const [videoReady, setVideoReady] = useState(false); const frame = useRef(0); const current = useRef({ x: 0, y: 0 }); const target = useRef({ x: 0, y: 0 });
  useEffect(() => { const video = videoRef.current; const startVideo = () => { if (!video || document.hidden) return; video.muted = true; video.defaultMuted = true; video.setAttribute('muted', ''); video.setAttribute('playsinline', ''); video.play().then(() => setVideoReady(true)).catch(() => setVideoReady(false)); }; const onMove = (event: MouseEvent) => { target.current.x = ((event.clientX - innerWidth / 2) / (innerWidth / 2)) * 18; target.current.y = ((event.clientY - innerHeight / 2) / (innerHeight / 2)) * 12; }; const loop = () => { current.current.x += (target.current.x - current.current.x) * .06; current.current.y += (target.current.y - current.current.y) * .06; if (videoRef.current) videoRef.current.style.transform = `translate3d(${current.current.x}px, ${current.current.y}px, 0) scale(1.08)`; frame.current = requestAnimationFrame(loop); }; startVideo(); const retry = window.setTimeout(startVideo, 250); addEventListener('mousemove', onMove, { passive: true }); addEventListener('pageshow', startVideo); addEventListener('visibilitychange', startVideo); frame.current = requestAnimationFrame(loop); return () => { clearTimeout(retry); removeEventListener('mousemove', onMove); removeEventListener('pageshow', startVideo); removeEventListener('visibilitychange', startVideo); cancelAnimationFrame(frame.current); }; }, []);
  const startOnTouch = () => { const video = videoRef.current; if (!video) return; video.muted = true; video.defaultMuted = true; video.play().then(() => setVideoReady(true)).catch(() => undefined); };
  return <section id="top" className="cinematic-hero" onPointerDown={startOnTouch} onTouchStart={startOnTouch} onClick={startOnTouch}><video ref={videoRef} className="cinematic-video" autoPlay muted loop playsInline disablePictureInPicture preload="auto" poster="/hero-first-frame.jpg" onPlaying={() => setVideoReady(true)} onLoadedMetadata={(event) => { event.currentTarget.muted = true; event.currentTarget.defaultMuted = true; event.currentTarget.playbackRate = 1.25; }}><source src="/hero-video.mp4" type="video/mp4" /></video><img className={`cinematic-poster ${videoReady ? 'is-hidden' : ''}`} src="/hero-first-frame.jpg" alt="" aria-hidden="true" /><div className="cinematic-shade" /><div className="cinematic-copy"><Reveal delay={.1}><p className="cinematic-kicker">Марафон «Умный путь к стройности» · SmartSlimWay</p></Reveal><Reveal delay={.2}><h1>Питание<br /><em>без крайностей.</em></h1></Reveal><Reveal delay={.3}><p className="cinematic-description">Собери свою систему питания — в своём ритме, с поддержкой и без вечной войны с собой.</p></Reveal><Reveal delay={.4}><a className="cinematic-cta" href="/application">Подать заявку <ArrowUpRight size={16} /></a></Reveal></div><div className="cinematic-bottom"><span>Три этапа · Личный наставник · Онлайн-анкета</span><span className="cinematic-scroll">Scroll to explore ↓</span></div></section>;
}
function Reviews() {
  const [active, setActive] = useState(0); const [paused, setPaused] = useState(false);
  useEffect(() => { if (paused) return; const timer = setInterval(() => setActive((x) => (x + 1) % testimonials.length), 3000); return () => clearInterval(timer); }, [paused]);
  const move = (direction: number) => setActive((x) => (x + direction + testimonials.length) % testimonials.length);
  return <section className="reviews" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}><div className="wide review-head"><h2>Что говорят <em>участницы</em></h2><div className="rating"><span>{[1, 2, 3, 4, 5].map((n) => <Star key={n} size={18} fill="currentColor" />)}</span> Поддержка каждый день</div></div><div className="review-window"><div className="review-track" style={{ transform: `translateX(calc(-${active} * (min(427.5px, calc(100vw - 48px)) + 24px)))` }}>{[...testimonials, ...testimonials, ...testimonials].map((item, i) => <article className="review-card" key={`${item[0]}-${i}`}><Quote size={26} strokeWidth={1.2} /><p>«{item[2]}»</p><div className="author"><div className="review-avatar">{item[3]}</div><div><strong>{item[0]}</strong><small>↳ {item[1]}</small></div></div></article>)}</div></div><div className="review-controls"><button onClick={() => move(-1)} aria-label="Предыдущий отзыв"><ChevronLeft size={19} /></button><button onClick={() => move(1)} aria-label="Следующий отзыв"><ChevronRight size={19} /></button></div></section>;
}
function Partner() {
  const [thumbs, setThumbs] = useState<{ id: number; src: string; x: number; y: number; rotate: number }[]>([]);
  const lastSpawn = useRef(0); const nextId = useRef(0); const cleanupTimers = useRef<number[]>([]);
  useEffect(() => () => cleanupTimers.current.forEach(window.clearTimeout), []);
  const addThumb = (event: React.PointerEvent<HTMLElement>) => {
    const touch = event.pointerType === 'touch'; const now = performance.now();
    if (now - lastSpawn.current < (touch ? 145 : 80)) return;
    lastSpawn.current = now;
    const box = event.currentTarget.getBoundingClientRect(); const id = ++nextId.current;
    setThumbs((all) => [...all.slice(-7), { id, src: gallery[Math.floor(Math.random() * gallery.length)], x: event.clientX - box.left, y: event.clientY - box.top, rotate: Math.random() * 20 - 10 }]);
    cleanupTimers.current.push(window.setTimeout(() => setThumbs((all) => all.filter((thumb) => thumb.id !== id)), 1000));
  };
  return <section className="partner wide" onPointerMove={addThumb} onPointerDown={addThumb}><div className="partner-inner"><p className="eyebrow">Твоя жизнь не обязана подстраиваться под меню</p><h2>Собери питание,<br /><em>которое подходит тебе.</em></h2><p className="touch-hint">Коснись экрана или проведи пальцем</p><a className="text-link partner-link" href="#application">Хочу научиться собирать тарелку <ArrowUpRight size={15} /></a></div>{thumbs.map((thumb) => <img className="cursor-thumb" key={thumb.id} src={thumb.src} alt="" aria-hidden="true" style={{ left: thumb.x, top: thumb.y, transform: `translate(-50%, -50%) rotate(${thumb.rotate}deg)` }} />)}</section>;
}
function Footer() { return <><footer className="site-footer wide"><div className="footer-signoff"><p className="eyebrow">Умный путь к стройности</p><p>Твоя тарелка. Твой ритм. Твоя система.</p></div><div className="footer-links"><ArrowUpRight size={18} /><div><a href="/program">Программа</a><a href="/reviews">Отзывы</a><a href="/about">О Наталье</a></div><div><a href="/application">Анкета</a><a href="/contacts">Контакты</a></div></div></footer><div className="copyright wide"><span>Умный путь к стройности</span><span>Онлайн-заявка на марафон</span></div></>; }
function ApplicationForm() {
  const [status, setStatus] = useState('');
  const [sending, setSending] = useState(false);
  const [hasConditions, setHasConditions] = useState<'yes' | 'no' | ''>('');
  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (hasConditions !== 'no') {
      setStatus(hasConditions === 'yes' ? 'При хронических заболеваниях мы не можем проводить марафон. Пожалуйста, обсуди питание с лечащим врачом.' : 'Ответь, пожалуйста, на вопрос о хронических заболеваниях.');
      return;
    }
    setSending(true);
    setStatus('Отправляю анкету...');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const telegram = String(form.get('telegram') || '').trim().replace(/^@/, '');
    const data = { createdAt: new Date().toISOString(), program: 'Умный путь к стройности', price: '6000', source: 'smartslimway-site', name: form.get('name') || '', phone: form.get('phone') || '', telegram, email: form.get('email') || '', age: form.get('age') || '', weight: form.get('weight') || '', goal: form.get('goal') || '', experience: form.get('experience') || '', chronicConditions: 'Нет', motivation: form.get('motivation') || '' };
    try {
      const saved = JSON.parse(localStorage.getItem('smart-path-applications') || '[]');
      localStorage.setItem('smart-path-applications', JSON.stringify([...saved, data]));
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      const response = await fetch(GOOGLE_SCRIPT_URL, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(data), signal: controller.signal });
      window.clearTimeout(timeout);
      if (!response.ok) throw new Error('sheet');
      setStatus('Анкета отправлена. Наталья свяжется с тобой лично.');
      formElement.reset();
      setHasConditions('');
    } catch {
      setStatus('Анкета сохранена локально. Проверь подключение к таблице и повтори отправку.');
    } finally {
      setSending(false);
    }
  };
  const blocked = hasConditions !== 'no';
  return <form className="application-form" onSubmit={submit}><div className="form-grid"><label>Имя *<input name="name" required placeholder="Твоё имя" /></label><label>Телефон *<input name="phone" type="tel" required placeholder="+7 (999) 123-45-67" /></label><label>Telegram<input name="telegram" placeholder="@username" /></label><label>Email *<input name="email" type="email" required placeholder="твой@email.com" /></label><label>Возраст<input name="age" type="number" min="18" max="99" placeholder="25" /></label><label>Текущий вес<input name="weight" placeholder="65 кг" /></label></div><label>Цель *<input name="goal" required placeholder="Например: наладить режим питания" /></label><fieldset><legend>Опыт с диетами</legend><label><input type="radio" name="experience" value="Новичок" /> Новичок</label><label><input type="radio" name="experience" value="Есть опыт" /> Есть опыт</label><label><input type="radio" name="experience" value="Пробовала много" /> Пробовала много</label></fieldset><fieldset className="medical-question"><legend>Есть ли у тебя хронические заболевания? *</legend><label><input required type="radio" name="chronicConditions" value="Нет" checked={hasConditions === 'no'} onChange={() => { setHasConditions('no'); setStatus(''); }} /> Нет</label><label><input required type="radio" name="chronicConditions" value="Да" checked={hasConditions === 'yes'} onChange={() => { setHasConditions('yes'); setStatus('При хронических заболеваниях мы не можем проводить марафон. Пожалуйста, обсуди питание с лечащим врачом.'); }} /> Да</label>{hasConditions === 'yes' && <p className="medical-warning" role="alert">При наличии хронических заболеваний мы не можем проводить для тебя марафон. Изменения питания необходимо согласовать с лечащим врачом.</p>}</fieldset><label>Почему хочешь участвовать?<textarea name="motivation" rows={4} placeholder="Расскажи о своей ситуации..." /></label><label className="consent"><input type="checkbox" required /> Согласна на обработку персональных данных</label><button className={`button primary ${blocked ? 'is-blocked' : ''}`} type="submit" disabled={sending || blocked}>{sending ? 'Отправляю...' : hasConditions === 'yes' ? 'Участие недоступно' : 'Отправить анкету'} <ArrowUpRight size={16} /></button><p className="form-status" role="status">{status}</p></form>;
}

type NutritionGoal = 'loss' | 'maintenance' | 'gain';
type NutritionProfile = { sex: 'female' | 'male'; age: number | ''; weight: number | ''; height: number | ''; activity: string; goal: NutritionGoal; meals: number };
type Nutrients = { calories: number; protein: number; fat: number; carbs: number };
type Food = Nutrients & { name: string; detail?: string };
type MealIngredient = Food & { grams: number; minGrams: number; maxGrams: number; step: number; display?: string };
type PlannedMeal = { title: string; ingredients: MealIngredient[]; nutrients: Nutrients };
const activityLevels = [
  ['low', 'Минимальная', 'Сидячая работа, тренировки редко', 1.2],
  ['light', 'Лёгкая', '1–3 тренировки в неделю', 1.375],
  ['moderate', 'Средняя', '3–5 тренировок в неделю', 1.55],
  ['high', 'Высокая', '6–7 тренировок в неделю', 1.725],
  ['very-high', 'Очень высокая', 'Тяжёлая физическая работа или 2 тренировки в день', 1.9],
] as const;
const goalCopy: Record<NutritionGoal, { title: string; adjustment: number; protein: number; image: string; note: string }> = {
  loss: { title: 'Снижение веса', adjustment: -0.17, protein: 1.8, image: gallery[1], note: 'Умеренный дефицит около 17% от поддержки — без экстремальных ограничений.' },
  maintenance: { title: 'Поддержание', adjustment: 0, protein: 1.8, image: gallery[1], note: 'Ориентир для сохранения текущего веса и стабильной энергии.' },
  gain: { title: 'Набор массы', adjustment: 0.1, protein: 1.8, image: gallery[1], note: 'Небольшой профицит около 10% от поддержки с акцентом на белок.' },
};
function calculateNutrition(profile: NutritionProfile) {
  const level = activityLevels.find(([id]) => id === profile.activity) || activityLevels[2];
  const age = Number(profile.age) || 0;
  const weight = Number(profile.weight) || 0;
  const height = Number(profile.height) || 0;
  const bmr = (10 * weight) + (6.25 * height) - (5 * age) + (profile.sex === 'male' ? 5 : -161);
  const maintenance = Math.round(bmr * level[3]);
  const config = goalCopy[profile.goal];
  const calories = Math.round((maintenance * (1 + config.adjustment)) / 10) * 10;
  const protein = Math.round(weight * config.protein);
  const fat = Math.round((calories * (profile.goal === 'loss' ? .25 : .3)) / 9);
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4));
  return { bmr: Math.max(0, Math.round(bmr)), maintenance: Math.max(0, maintenance), calories: Math.max(0, calories), protein, fat, carbs, config, activityName: level[1] };
}
const foods: Record<string, Food> = {
  egg: { name: 'Яйца', detail: 'вес без скорлупы · до приготовления', calories: 143, protein: 12.6, fat: 9.5, carbs: .7 },
  oats: { name: 'Овсянка долгой варки', detail: 'сухой вес · сварить на воде', calories: 379, protein: 13.2, fat: 6.5, carbs: 67.7 },
  berries: { name: 'Ягоды', detail: 'вес до приготовления · свежие или замороженные', calories: 50, protein: .7, fat: .3, carbs: 11.5 },
  chicken: { name: 'Куриная грудка без кожи', detail: 'сырой вес · запечь без дополнительного масла', calories: 120, protein: 22.5, fat: 2.6, carbs: 0 },
  turkey: { name: 'Филе индейки', detail: 'сырой вес · запечь или потушить без дополнительного масла', calories: 114, protein: 23.7, fat: 2, carbs: 0 },
  cod: { name: 'Треска', detail: 'нежирная белая рыба · сырой вес · запечь', calories: 82, protein: 18, fat: .7, carbs: 0 },
  pollock: { name: 'Минтай', detail: 'нежирная белая рыба · сырой вес · приготовить без масла', calories: 72, protein: 15.9, fat: .9, carbs: 0 },
  hake: { name: 'Хек', detail: 'нежирная белая рыба · сырой вес · запечь', calories: 86, protein: 16.6, fat: 2.2, carbs: 0 },
  shrimp: { name: 'Креветки', detail: 'очищенные · сырой вес · быстро потушить', calories: 85, protein: 20.1, fat: .5, carbs: 0.2 },
  squid: { name: 'Кальмар', detail: 'сырой вес · быстро приготовить без масла', calories: 92, protein: 15.6, fat: 1.4, carbs: 3.1 },
  buckwheat: { name: 'Зелёная гречка', detail: 'сухой вес · отварить на воде', calories: 343, protein: 13.3, fat: 3.4, carbs: 71.5 },
  salad: { name: 'Овощной салат', detail: 'сырой вес · огурец, томат и зелень', calories: 27, protein: 1.2, fat: .3, carbs: 4.8 },
  oliveOil: { name: 'Оливковое масло', detail: 'точный вес заправки', calories: 884, protein: 0, fat: 100, carbs: 0 },
  salmon: { name: 'Лосось', detail: 'сырой вес · запечь без дополнительного масла', calories: 208, protein: 20, fat: 13, carbs: 0 },
  vegetables: { name: 'Зелёные овощи', detail: 'сырой вес · брокколи, кабачок, стручковая фасоль', calories: 35, protein: 2.4, fat: .4, carbs: 5.5 },
  yogurt: { name: 'Греческий йогурт 2%', detail: 'вес продукта из упаковки', calories: 73, protein: 10, fat: 2, carbs: 3.6 },
  apple: { name: 'Яблоко', detail: 'вес съедобной части', calories: 52, protein: .3, fat: .2, carbs: 13.8 },
  almonds: { name: 'Миндаль', detail: 'без обжарки и масла', calories: 579, protein: 21.2, fat: 49.9, carbs: 21.6 },
  cottageCheese: { name: 'Творог 5%', detail: 'вес продукта из упаковки', calories: 145, protein: 21, fat: 5, carbs: 3 },
  banana: { name: 'Банан', detail: 'вес без кожуры', calories: 89, protein: 1.1, fat: .3, carbs: 22.8 },
  bread: { name: 'Цельнозерновой хлеб', detail: 'вес готового продукта', calories: 247, protein: 13, fat: 3.4, carbs: 41 },
  avocado: { name: 'Авокадо', detail: 'вес мякоти', calories: 160, protein: 2, fat: 14.7, carbs: 8.5 },
};
const mealWord = (count: number) => count < 5 ? 'приёма пищи' : 'приёмов пищи';
function ingredient(food: Food, grams: number, minGrams = grams, maxGrams = grams, step = 5): MealIngredient {
  return { ...food, grams, minGrams, maxGrams, step };
}
function sumNutrients(ingredients: MealIngredient[]): Nutrients {
  const totals = ingredients.reduce((total, item) => ({
    calories: total.calories + item.calories * item.grams / 100,
    protein: total.protein + item.protein * item.grams / 100,
    fat: total.fat + item.fat * item.grams / 100,
    carbs: total.carbs + item.carbs * item.grams / 100,
  }), { calories: 0, protein: 0, fat: 0, carbs: 0 });
  return { ...totals, calories: totals.protein * 4 + totals.fat * 9 + totals.carbs * 4 };
}
function buildMealPlan(target: Nutrients, mealCount: number, profile: Pick<NutritionProfile, 'age' | 'weight' | 'sex'>): { meals: PlannedMeal[]; nutrients: Nutrients } {
  // Rotate complete food combinations so repeated calculator submissions do not return one fixed menu.
  const variation = (Number(profile.age) + Math.floor(Number(profile.weight) || 0) + (profile.sex === 'male' ? 1 : 0)) % 4;
  const mealOrder = mealCount === 3
    ? ['breakfast', 'lunch', 'dinner']
    : mealCount === 4
      ? ['breakfast', 'lunch', 'snack1', 'dinner']
      : ['breakfast', 'snack1', 'lunch', 'snack2', 'dinner'];
  const lunchProteins = [foods.salmon, foods.shrimp, foods.cod, foods.turkey];
  const dinnerProteins = [foods.chicken, foods.pollock, foods.squid, foods.hake];
  const templates: Record<string, { title: string; portions: [Food, number, number, number, number?][] }> = {
    breakfast: { title: 'Завтрак', portions: [[foods.egg, 150, 100, 150, 50], [foods.oats, 60, 35, 100], [foods.berries, 100, 50, 150], [foods.bread, 60, 0, 160]] },
    lunch: { title: 'Обед', portions: [[lunchProteins[variation], variation === 1 ? 180 : 160, 120, 240], [foods.buckwheat, 70, 45, 120], [foods.salad, 250, 150, 300], [foods.oliveOil, 8, 3, 15, 1], [foods.avocado, 50, 0, 100], [foods.bread, 60, 0, 120]] },
    snack1: { title: 'Перекус', portions: [[foods.yogurt, 200, 150, 250], [foods.apple, 150, 100, 180], [foods.almonds, 15, 10, 25, 1]] },
    snack2: { title: 'Второй перекус', portions: [[foods.cottageCheese, 170, 80, 220], [foods.banana, 120, 60, 160]] },
    dinner: { title: 'Ужин', portions: [[dinnerProteins[variation], variation === 2 ? 230 : 220, 150, 320], [foods.vegetables, 280, 150, 350], [foods.oliveOil, 8, 3, 15, 1]] },
  };
  const selected = mealOrder.map((key) => templates[key]);
  const meals = selected.map((meal) => { const ingredients = meal.portions.map(([food, base, min, max, step = 5]) => ingredient(food, base, min, max, step)); return { title: meal.title, ingredients, nutrients: sumNutrients(ingredients) }; });
  const adjustable = meals.flatMap((meal) => meal.ingredients);
  const objective = (nutrients: Nutrients) => {
    const proteinShortfall = Math.max(0, target.protein - nutrients.protein);
    const proteinExcess = Math.max(0, nutrients.protein - target.protein);
    const shares = mealCount === 3 ? [.28, .42, .3] : mealCount === 4 ? [.25, .35, .15, .25] : [.22, .12, .3, .12, .24];
    const distributionPenalty = meals.reduce((score, meal, index) => score + ((meal.nutrients.calories - target.calories * shares[index]) / 6) ** 2, 0);
    return ((nutrients.calories - target.calories) / 6) ** 2 + proteinShortfall ** 2 * 16 + proteinExcess ** 2 * .35 + ((nutrients.fat - target.fat) * 1.5) ** 2 + ((nutrients.carbs - target.carbs) * .7) ** 2 + distributionPenalty;
  };
  const planNutrients = () => meals.reduce((total, meal) => { meal.nutrients = sumNutrients(meal.ingredients); return { calories: total.calories + meal.nutrients.calories, protein: total.protein + meal.nutrients.protein, fat: total.fat + meal.nutrients.fat, carbs: total.carbs + meal.nutrients.carbs }; }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  let current = planNutrients();
  for (let pass = 0; pass < 500; pass += 1) {
    let improved = false;
    for (const item of adjustable) {
      const before = item.grams;
      const beforeScore = objective(current);
      for (const delta of [-1, 1]) {
        item.grams = Math.max(item.minGrams, Math.min(item.maxGrams, before + delta * item.step));
        const candidate = planNutrients();
        if (objective(candidate) < beforeScore) { current = candidate; improved = true; break; }
        item.grams = before;
        current = planNutrients();
      }
    }
    if (!improved) break;
  }
  meals.forEach((meal) => { meal.ingredients = meal.ingredients.filter((item) => item.grams > 0); meal.nutrients = sumNutrients(meal.ingredients); meal.ingredients.forEach((item) => { if (item.name === 'Яйца') item.display = `${item.grams / 50} шт. · ${item.grams} г`; }); });
  current = planNutrients();
  return { meals, nutrients: current };
}
function NutritionCalculator() {
  const [profile, setProfile] = useState<NutritionProfile>({ sex: 'female', age: '', weight: '', height: '', activity: 'moderate', goal: 'loss', meals: 4 });
  const [submitted, setSubmitted] = useState(false);
  const result = calculateNutrition(profile);
  const update = (key: keyof NutritionProfile, value: string | number) => setProfile((old) => ({ ...old, [key]: value }));
  const mealPlan = buildMealPlan({ calories: result.calories, protein: result.protein, fat: result.fat, carbs: result.carbs }, profile.meals, profile);
  return <PageNav><section className="calculator-hero wide"><div><p className="eyebrow">Калькулятор КБЖУ · для взрослых 18+</p><h1>Твоя точка<br /><em>старта.</em></h1><p>Заполни данные — получишь BMR, норму для поддержания, дефицит и КБЖУ на день.</p></div><div className="calculator-method"><Sparkles size={20} /><strong>Сначала BMR, затем активность</strong><span>Mifflin–St Jeor → КФА → цель и мягкая коррекция калорий.</span></div></section><section className="calculator-layout wide"><form className="nutrition-form" onSubmit={(event) => { event.preventDefault(); setSubmitted(true); }}><div className="calculator-form-head"><p className="eyebrow">Шаг 01</p><h2>Расскажите<br /><em>о себе.</em></h2></div><div className="nutrition-fields"><fieldset><legend>Пол</legend><div className="choice-row"><label><input type="radio" checked={profile.sex === 'female'} onChange={() => update('sex', 'female')} name="sex" /> Женщина</label><label><input type="radio" checked={profile.sex === 'male'} onChange={() => update('sex', 'male')} name="sex" /> Мужчина</label></div></fieldset><div className="nutrition-grid"><label>Возраст<input required type="number" min="18" max="99" value={profile.age} placeholder="30" onChange={(e) => update('age', e.target.value === '' ? '' : Number(e.target.value))} /><span>лет</span></label><label>Вес<input required type="number" min="35" max="250" value={profile.weight} placeholder="70" step="0.1" onChange={(e) => update('weight', e.target.value === '' ? '' : Number(e.target.value))} /><span>кг</span></label><label>Рост<input required type="number" min="130" max="230" value={profile.height} placeholder="165" onChange={(e) => update('height', e.target.value === '' ? '' : Number(e.target.value))} /><span>см</span></label><label>Приёмов пищи<select value={profile.meals} onChange={(e) => update('meals', Number(e.target.value))}><option value="3">3 раза</option><option value="4">4 раза</option><option value="5">5 раз</option></select></label></div><fieldset><legend>Активность</legend><div className="activity-list">{activityLevels.map(([id, name, note]) => <label key={id} className={profile.activity === id ? 'selected' : ''}><input type="radio" name="activity" checked={profile.activity === id} onChange={() => update('activity', id)} /><span><b>{name}</b><small>{note}</small></span></label>)}</div></fieldset><fieldset><legend>Цель</legend><div className="goal-grid">{(Object.keys(goalCopy) as NutritionGoal[]).map((goal) => <label key={goal} className={profile.goal === goal ? 'selected' : ''}><input type="radio" name="goal" checked={profile.goal === goal} onChange={() => update('goal', goal)} /><b>{goalCopy[goal].title}</b><small>{goal === 'loss' ? '−17% к поддержке' : goal === 'gain' ? '+10% к поддержке' : 'Без коррекции'}</small></label>)}</div></fieldset></div><button className="button primary calculator-submit" type="submit">Рассчитать мой рацион <ArrowUpRight size={16} /></button></form><aside className={`nutrition-result ${submitted ? 'is-visible' : ''}`} aria-live="polite"><div className="result-label"><Utensils size={17} /> Твой ориентир на день</div><div className="calculation-steps"><span><small>01 · BMR в покое</small><b>{result.bmr} ккал</b></span><span><small>02 · Поддержание</small><b>{result.maintenance} ккал</b></span><span className="active"><small>03 · {result.config.title}</small><b>{result.calories} ккал</b></span></div><p className="result-goal">Итоговая норма</p><strong className="result-calories">{result.calories}<small>ккал</small></strong><div className="macro-grid"><span><b>{result.protein} г</b>Белки</span><span><b>{result.fat} г</b>Жиры</span><span><b>{result.carbs} г</b>Углеводы</span></div><p className="result-note">{result.config.note}</p><div className="result-meta"><span><Activity size={14} /> {result.activityName} активность</span><span>КФА учтён · BMR {result.bmr} ккал</span></div></aside></section>{submitted && <section className="daily-plan wide"><div className="daily-plan-media"><img src={result.config.image} alt="Пример сбалансированного блюда на день" /><div><span>Пример рациона на день</span><strong>{Math.round(mealPlan.nutrients.calories)} ккал · {profile.meals} {mealWord(profile.meals)}</strong></div></div><div className="daily-plan-content"><p className="eyebrow">Все продукты и заправки учтены</p><h2>Питание<br /><em>на сегодня.</em></h2><div className="weighing-note"><strong>Как читать граммовки</strong><p>Крупы указаны в сухом виде, мясо и рыба — в сыром, овощи и фрукты — до приготовления. Вода при варке меняет вес, но не добавляет калорий. Масло, соусы и заправки взвешиваем отдельно: они уже включены в итог.</p></div><div className="meal-list">{mealPlan.meals.map((meal, index) => <div className="meal-item" key={meal.title}><div className="meal-heading"><span>0{index + 1} · {meal.title}</span><b>{Math.round(meal.nutrients.calories)} ккал</b></div><ul>{meal.ingredients.map((item) => <li key={`${meal.title}-${item.name}`}><span>{item.name}{item.detail && <small>{item.detail}</small>}</span><strong>{item.display || `${item.grams} г`}</strong></li>)}</ul></div>)}</div><div className="plan-total"><span>Итого по указанным продуктам</span><strong>{Math.round(mealPlan.nutrients.calories)} ккал · Б {Math.round(mealPlan.nutrients.protein)} · Ж {Math.round(mealPlan.nutrients.fat)} · У {Math.round(mealPlan.nutrients.carbs)} г</strong></div><p className="plan-explanation"><strong>Как распределить продукты.</strong> Если тебе так комфортнее, крупы и крахмалистые овощи — картофель, тыкву, морковь или свёклу — можно чаще включать в первую половину дня. Для более мягкого гликемического отклика желательно выбирать овсянку долгой варки, гречку, перловку, киноа, бурый рис или булгур, учитывая размер порции и способ приготовления. Жирную рыбу, если это возможно, тоже удобно оставить для дневного приёма пищи.</p><p className="plan-explanation">Если вечером хочется лёгкости, можно выбрать нежирный белок, зелень и некрахмалистые овощи. Это не строгое правило, а один из вариантов собрать сытный приём пищи без ощущения тяжести.</p><p className="plan-explanation"><strong>Питьевой режим и зелень.</strong> В течение дня желательно пить понемногу, ориентируясь на жажду и самочувствие. Если это возможно, добавляй к основным приёмам пищи зелень и зелёные овощи: это простой способ получить больше клетчатки, фолатов и антиоксидантов без лишней калорийности.</p><p className="plan-motivation">Когда понимаешь принцип, один пропущенный продукт больше не ломает весь день.</p></div></section>}<section className="calculator-disclaimer wide"><ShieldAlert size={17} /><p>Расчёт — ориентировочный для здоровых взрослых. Пищевая ценность зависит от конкретных продуктов и способа приготовления. При беременности, грудном вскармливании, возрасте до 18 лет, заболеваниях или нарушениях пищевого поведения нужен врач или диетолог.</p></section></PageNav>;
}

function PageNav({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  useEffect(() => { const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false); addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey); }, []);
  const links = [['/', 'Главная'], ['/calculator', 'Расчёт КБЖУ'], ['/about', 'О Наталье'], ['/program', 'Программа'], ['/reviews', 'Результаты'], ['/faq', 'FAQ'], ['/contacts', 'Контакты']];
  return <main><header className="topbar"><a className="mini-logo" href="/">SSW<span>.</span></a><span className="top-note">Марафон «Умный путь к стройности» / 2026</span><div className="top-actions"><a className="nav-link" href="/calculator">Рассчитать КБЖУ <ArrowUpRight size={14} /></a><button className="menu-trigger" type="button" onClick={() => setOpen(true)} aria-label="Открыть меню"><Menu size={23} strokeWidth={1.5} /></button></div></header><div className={`menu-overlay ${open ? 'is-open' : ''}`} onClick={() => setOpen(false)} /><aside className={`menu-drawer ${open ? 'is-open' : ''}`} aria-hidden={!open}><button className="menu-close" type="button" onClick={() => setOpen(false)} aria-label="Закрыть меню"><X size={23} /></button><p className="eyebrow">Умный путь к стройности</p><p className="drawer-title">Выбери свой<br /><em>следующий шаг.</em></p><nav className="drawer-links">{links.map(([href, label], i) => <a key={href} href={href} onClick={() => setOpen(false)}><span>0{i + 1}</span>{label}<ArrowUpRight size={15} /></a>)}</nav></aside>{children}<Footer /><nav className="bottom-nav" aria-label="Быстрая заявка"><button className="bottom-menu" type="button" onClick={() => setOpen(true)} aria-label="Открыть меню"><Menu size={19} /></button><span>SSW</span><a className="button primary" href="/application">Подать заявку <ArrowUpRight size={14} /></a></nav></main>;
}
function InnerPage({ path }: { path: string }) {
  const data: Record<string, { kicker: string; title: React.ReactNode; copy: string }> = {
    '/about': { kicker: 'Наталья · 48 лет · дипломированный нутрициолог', title: <>Питание, которое<br /><em>встраивается в жизнь.</em></>, copy: 'Помогаю выстроить понятный рацион, который учитывает твою цель, вкусы, привычки и реальный распорядок дня.' },
    '/program': { kicker: 'Марафон «Умный путь к стройности»', title: <>Три этапа к<br /><em>своей системе.</em></>, copy: 'Не выдаём жёсткое меню на две недели. Учим рассчитывать порции, выбирать продукты и самостоятельно собирать рацион под свой день.' },
    '/reviews': { kicker: 'Опыт участниц', title: <>Результат начинается<br /><em>с поддержки.</em></>, copy: 'Здесь собраны истории участниц. Реальные отзывы и скриншоты публикуются только с согласия и после подтверждения.' },
    '/faq': { kicker: 'Вопросы перед стартом', title: <>Разобраться<br /><em>спокойно.</em></>, copy: 'Ответы на главные вопросы о формате, меню, сопровождении и стоимости марафона.' },
    '/contacts': { kicker: 'Связаться напрямую', title: <>Готова начать<br /><em>свой путь?</em></>, copy: 'Наталья ответит лично, расскажет детали программы и поможет сделать первый шаг без стресса.' },
    '/calculator': { kicker: 'Расчёт КБЖУ', title: <>Твоя точка<br /><em>старта.</em></>, copy: 'Индивидуальный ориентир по калориям, белкам, жирам и углеводам.' },
    '/application': { kicker: 'Анкета на участие', title: <>Перед стартом<br /><em>познакомимся.</em></>, copy: 'Заполни анкету — она попадёт в онлайн-таблицу, а Наталья свяжется с тобой лично и ответит на вопросы о марафоне.' },
  };
  const current = data[path] || data['/about'];
  if (path === '/calculator') return <NutritionCalculator />;
  return <PageNav><section className="inner-hero wide"><Reveal><p className="eyebrow">{current.kicker}</p><h1>{current.title}</h1><p>{current.copy}</p></Reveal></section>{path === '/about' && <AboutContent />}{path === '/program' && <ProgramContent />}{path === '/reviews' && <ReviewsContent />}{path === '/faq' && <FaqContent />}{path === '/application' && <section className="inner-content wide"><div className="application-layout"><div className="application-intro"><p className="eyebrow">Марафон «Умный путь к стройности»</p><h2>Заявка на<br /><em>участие.</em></h2><p>Стоимость программы — <strong>6 000 ₽</strong>.</p><ul><li>Личная формула рациона и КБЖУ</li><li>Личный наставник каждый день</li><li>Практика замен и сборки тарелки</li></ul></div><ApplicationForm /></div></section>}{path === '/contacts' && <ContactContent application={false} />}</PageNav>;
}
function AboutContent() { return <section className="inner-content wide"><div className="inner-split"><div><p className="eyebrow">Наталья · 48 лет</p><h2>Нутрициолог<br /><em>и наставник.</em></h2></div><div><p>Я — Наталья, дипломированный нутрициолог и создатель марафона «Умный путь к стройности».</p><p>Помогаю девушкам разобраться в белках, жирах и углеводах, рассчитать индивидуальную суточную норму КБЖУ и собрать рацион под вкус, цель и образ жизни.</p><div className="fact-row"><span>48<small>лет опыта жизни и наблюдений за привычками</small></span><span>1 : 1<small>личная обратная связь</small></span><span>3<small>этапа программы</small></span></div></div></div><div className="expertise-band"><div><p className="eyebrow">На марафоне разбираем</p><h3>Почему голод<br /><em>не всегда про еду.</em></h3></div><p>Говорим о сигналах голода и сытости, роли инсулина, лептина и грелина, простых и сложных углеводах, полезных жирах и белках. Учимся выбирать продукты без тревоги и собирать сбалансированную тарелку.</p></div><div className="knowledge-grid"><article><span>01</span><h3>Хлорофилл и зелень</h3><p>Разберём, чем полезны зелёные овощи и зелень, какие микроэлементы они дают и как полноценный рацион поддерживает кроветворение и доставку кислорода к тканям.</p></article><article><span>02</span><h3>Питьевой режим</h3><p>Научимся распределять воду в течение дня и ориентироваться на жажду, активность, погоду и индивидуальные ограничения.</p></article><article><span>03</span><h3>Способ приготовления</h3><p>Поймём, как учитывать масло, соусы, заправки и термическую обработку, не добавляя в рацион незаметные лишние жиры.</p></article></div><img className="inner-image" src={gallery[1]} alt="Полезное блюдо на кухне" /></section>; }
function ProgramContent() { return <section className="inner-content wide"><div className="inner-section-title"><p className="eyebrow">Что входит</p><h2>Понятный маршрут<br /><em>без крайностей.</em></h2></div><div className="inner-stage-grid">{stages.map((stage, i) => <article className={i === 1 ? 'dark-plan' : ''} key={stage[0]}><span>Этап 0{i + 1}</span><h3>{stage[0]}</h3><p>{stage[1]}</p><strong>{stage[2]}</strong></article>)}</div><div className="program-details"><p className="eyebrow">Внутри программы</p><p><strong>Правила взвешивания и учёта.</strong> Крупы взвешиваем в сухом виде, а мясо, птицу и рыбу — до приготовления. Во время термической обработки продукты набирают или теряют воду, поэтому вес готового блюда меняется. Масло, соусы и заправки учитываем отдельно — даже небольшое их количество влияет на общую калорийность рациона.</p><p><strong>Скрытые жиры и осознанный выбор продуктов.</strong> На практике разбираем, откуда в рационе появляются незаметные лишние жиры, зачем в некоторых случаях снимать кожу с птицы и на что обращать внимание при выборе продуктов. Такие детали помогают точнее оценивать рацион и управлять его калорийностью без жёстких запретов.</p><p><strong>Распределение продуктов в течение дня.</strong> Разбираемся, как распределять крупы, крахмалистые овощи, жирную рыбу и другие продукты с учётом режима дня, активности и личных предпочтений. Учимся составлять приёмы пищи так, чтобы они давали энергию, обеспечивали сытость и не создавали ощущения тяжести.</p><p><strong>Питьевой режим, зелень и овощи.</strong> Отдельно говорим о питьевом режиме и роли зелени и овощей в ежедневном рационе. Это не «модная добавка», а доступный источник клетчатки и микронутриентов, который поддерживает пищеварение, разнообразие питания и комфортное насыщение.</p></div><blockquote className="program-quote">«Свобода в питании начинается не с идеального меню, а с понимания, как выбрать то, что подходит тебе сегодня».</blockquote></section>; }
function ReviewsContent() { return <section className="inner-content wide"><div className="review-grid-static">{testimonials.map((item) => <article className="review-card" key={item[3]}><Quote size={24} /><p>«{item[2]}»</p><div className="author"><div className="review-avatar">{item[3]}</div><div><strong>{item[0]}</strong><small>{item[1]}</small></div></div></article>)}</div><p className="pending-note">Имена и результаты требуют подтверждения участниц перед публикацией.</p></section>; }
const faqItems = [
  ['Как проходит марафон?', 'Сначала рассчитываем ориентир и разбираем текущий рацион. Затем учимся собирать каждый приём пищи, практикуем замены и каждый день получаем обратную связь.'],
  ['Нужно ли постоянно считать калории?', 'Нет. В начале КБЖУ и граммы помогают увидеть свои порции. Цель — понять принцип тарелки и со временем выбирать еду уверенно, без постоянной зависимости от калькулятора.'],
  ['Вы даёте готовое меню?', 'Примеры рационов будут, но это не жёсткая таблица. Ты учишься выбирать равноценные продукты и собирать тарелку под свой вкус, цель и распорядок дня.'],
  ['А если я не люблю продукты из примера?', 'Это нормальная ситуация, а не нарушение плана. Вместе подбираем замену: картофель вместо крупы, рыбу вместо курицы, другой овощ или привычную заправку в рассчитанном количестве.'],
  ['Что делать, если сорвалась или пропустила день?', 'Не начинать жизнь заново с понедельника. Разбираем, что произошло, и спокойно возвращаемся к следующему приёму пищи без наказаний и голодовки.'],
  ['Подойдёт ли марафон без опыта?', 'Да. Всё объясняется от базовых принципов, а Наталья помогает применить их к твоим продуктам и обычному распорядку дня.'],
];
function FaqContent() { return <section className="inner-content wide faq-experience"><div className="faq-intro"><p className="eyebrow">Без неудобных вопросов не бывает хорошего решения</p><blockquote>«Тебе не нужно заранее всё знать. Достаточно быть готовой разобраться в себе без осуждения».</blockquote></div><div className="faq-grid full-faq">{faqItems.map(([question, answer], index) => <details open={index === 0} key={question}><summary><span>{question}</span><ArrowUpRight size={18} /></summary><p>{answer}</p></details>)}</div></section>; }
function ContactContent({ application }: { application: boolean }) { return <section className="inner-content wide"><div className="contact-card contact-card-rich"><div><p className="eyebrow">{application ? 'Марафон «Умный путь к стройности»' : 'Личный контакт'}</p><h2>{application ? <>Оставь заявку<br /><em>на участие.</em></> : <>Начни не с диеты.<br /><em>Начни с разговора.</em></>}</h2></div><div className="contact-card-copy"><p>Анкета — это не обязательство купить курс. Наталья прочитает ответы лично, уточнит твою цель и честно скажет, подходит ли такой формат.</p><blockquote>«Хороший план начинается не со списка продуктов, а с понимания человека».</blockquote><a className="text-link" href="/application">Рассказать о своей ситуации <ArrowUpRight size={16} /></a></div></div></section>; }
function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setMenuOpen(false); }; addEventListener('keydown', onKey); return () => removeEventListener('keydown', onKey); }, []);
  const closeMenu = () => setMenuOpen(false);
  return <main><header className="topbar"><a className="mini-logo" href="/">SSW<span>.</span></a><span className="top-note">Марафон «Умный путь к стройности» / 2026</span><div className="top-actions"><a className="nav-link" href="/calculator">Рассчитать КБЖУ <ArrowUpRight size={14} /></a><button className="menu-trigger" type="button" onClick={() => setMenuOpen(true)} aria-label="Открыть меню" aria-expanded={menuOpen}><Menu size={23} strokeWidth={1.5} /></button></div></header>
    <div className={`menu-overlay ${menuOpen ? 'is-open' : ''}`} onClick={closeMenu} aria-hidden="true" />
    <aside className={`menu-drawer ${menuOpen ? 'is-open' : ''}`} aria-label="Навигация по сайту" aria-hidden={!menuOpen}><button className="menu-close" type="button" onClick={closeMenu} aria-label="Закрыть меню"><X size={23} /></button><p className="eyebrow">Умный путь к стройности</p><p className="drawer-title">Выбери свой<br /><em>следующий шаг.</em></p><nav className="drawer-links"><a href="/" onClick={closeMenu}><span>01</span>Главная <ArrowUpRight size={15} /></a><a href="/calculator" onClick={closeMenu}><span>02</span>Расчёт КБЖУ <ArrowUpRight size={15} /></a><a href="/about" onClick={closeMenu}><span>03</span>О Наталье <ArrowUpRight size={15} /></a><a href="/program" onClick={closeMenu}><span>04</span>Программа <ArrowUpRight size={15} /></a><a href="/reviews" onClick={closeMenu}><span>05</span>Результаты <ArrowUpRight size={15} /></a><a href="/faq" onClick={closeMenu}><span>06</span>FAQ <ArrowUpRight size={15} /></a><a href="/contacts" onClick={closeMenu}><span>07</span>Контакты <ArrowUpRight size={15} /></a></nav></aside>
    <CinematicHero /><section className="hero page-column editorial-intro"><Reveal delay={.1}><div className="logo">Умный путь<br />к стройности</div></Reveal><Reveal delay={.2}><div className="eyebrow">Практический марафон питания</div></Reveal><Reveal delay={.3}><h2 className="editorial-title">Не меню на<br />две недели.<br /><em>Навык на жизнь.</em></h2></Reveal><Reveal delay={.4} className="intro"><p>Мы не привязываем тебя к таблице, где сегодня обязательно гречка, а завтра картофель. Учим самостоятельно собирать сбалансированный рацион под свою норму, вкус и распорядок дня.</p><p>Ты поймёшь размеры порций и логику замен: сможешь выбрать картофель, крупу или макароны и сохранить баланс тарелки без чувства, что всё испорчено.</p><p className="intro-motivation">Не нужно становиться идеальной. Нужно научиться выбирать то, что поддерживает тебя каждый день.</p></Reveal><Reveal delay={.5} className="hero-actions"><a className="button secondary" href="#program">Посмотреть, как это работает <ArrowUpRight size={16} /></a></Reveal></section>
    <section id="work" className="marquee-wrap" aria-label="Питание и забота о себе"><div className="marquee-track">{[...gallery, ...gallery].map((src, i) => <img key={`${src}-${i}`} src={src} alt="Питание, движение и забота о себе" loading={i > 3 ? 'lazy' : 'eager'} />)}</div></section>
    <section id="about" className="quote-section page-column"><Reveal delay={.1}><Quote size={25} strokeWidth={1.5} /></Reveal><Reveal delay={.2}><blockquote>«Ты не ленивая. Ты просто устала от правил, которые невозможно встроить в жизнь».</blockquote></Reveal><Reveal delay={.3}><cite>— Наталья, нутрициолог и наставник</cite></Reveal><Reveal delay={.4} className="logos"><span>1 : 1</span><span>3 этапа</span><span>+ support</span></Reveal><Reveal delay={.5}><ParallaxImage /></Reveal></section>
    <section id="program" className="pricing wide"><Reveal className="pricing-title"><p className="eyebrow">Как строится программа</p><h2>Питание без войны<br /><em>с собой.</em></h2></Reveal><div className="pricing-grid">{stages.map((stage, i) => <Reveal key={stage[0]} delay={i * .1}><article className={`plan ${i === 1 ? 'dark-plan' : 'light-plan'} stage-plan`}><span className="stage-number">Этап 0{i + 1}</span><h3>{stage[0]}</h3><p>{stage[1]}</p><strong>{stage[2]}</strong></article></Reveal>)}</div></section>
    <section id="reviews"><Reviews /></section>
    <section className="case-studies wide"><Reveal><p className="eyebrow">Что входит в марафон</p><h2>Система, которая<br /><em>остаётся с тобой.</em></h2></Reveal><div className="case-list">{[['Твоя формула тарелки', 'Понятные порции белка, гарнира, овощей и жиров под твою цель', gallery[1]], ['Практика замен', 'Картофель, гречка или макароны — учимся выбирать без страха и запретов', gallery[2]], ['Ежедневная связь', 'Личный наставник, разбор тарелок, обратная связь и групповой чат', gallery[5]]].map((item, i) => <Reveal key={item[0]} delay={i * .1}><article className="case-item"><div className="case-label"><h3>{item[0]}</h3><p>{item[1]}</p></div><img src={item[2]} alt={item[0]} loading="lazy" /></article></Reveal>)}</div></section>
    <Partner /><section id="application" className="manifesto"><div className="manifesto-inner"><Reveal><p className="eyebrow light">Марафон «Умный путь к стройности»</p><h2>Первый шаг —<br /><em>оставить заявку.</em></h2></Reveal><Reveal delay={.2} className="manifesto-copy"><p>После заявки Наталья свяжется с тобой лично, расскажет детали участия и поможет понять, подходит ли тебе такой формат.</p><a className="text-link" href="/application">Заполнить анкету <ArrowUpRight size={15} /></a></Reveal></div></section>
    <section id="faq" className="faq wide"><Reveal><p className="eyebrow">Вопросы перед стартом</p><h2>Сомнения —<br /><em>это нормально.</em></h2><p className="faq-lead">Марафон не требует идеальной дисциплины. Он нужен, чтобы научиться принимать понятные решения даже в неидеальный день.</p></Reveal><div className="faq-grid">{faqItems.slice(0, 4).map(([question, answer]) => <details key={question}><summary><span>{question}</span><ArrowUpRight size={18} /></summary><p>{answer}</p></details>)}</div></section>
    <section id="calories" className="calorie-band"><div className="calorie-inner wide"><div><p className="eyebrow light">Быстрый первый шаг</p><h2>Понять свою<br /><em>точку старта.</em></h2></div><a className="button light-button" href="/calculator">Рассчитать КБЖУ <ArrowUpRight size={16} /></a></div></section>
    <section id="contacts" className="contact page-column"><Reveal><div className="eyebrow">Не ещё одна диета</div><h2>Твоя еда может<br /><em>стать опорой.</em></h2><p className="contact-lead">Без запретов, чужих таблиц и попыток быть идеальной. С пониманием своей нормы, свободой выбора и поддержкой человека, который поможет не бросить на полпути.</p><blockquote>«Самостоятельность начинается в тот момент, когда ты можешь посмотреть на продукты и спокойно решить: вот моя тарелка на сегодня».</blockquote></Reveal><a className="contact-submit" href="/application">Понять, подходит ли мне марафон <ArrowUpRight size={17} /></a><footer><span>Умный путь к стройности © 2026</span><span>Информация не заменяет консультацию врача</span><a href="#top">Наверх ↑</a></footer></section><Footer /><nav className="bottom-nav" aria-label="Быстрая заявка"><button className="bottom-menu" type="button" onClick={() => setMenuOpen(true)} aria-label="Открыть меню"><Menu size={19} /></button><span>SSW</span><a className="button primary" href="/application">Подать заявку <ArrowUpRight size={14} /></a></nav>
  </main>;
}
const path = window.location.pathname.replace(/\/$/, '') || '/';
createRoot(document.getElementById('root')!).render(<StrictMode>{path === '/' || path === '/smartslimway' ? <App /> : <InnerPage path={path} />}</StrictMode>);
