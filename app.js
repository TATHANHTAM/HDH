"use strict";

const modeList = document.getElementById("mode-list");
const modeToggle = document.getElementById("mode-toggle");
const sidebar = document.querySelector(".sidebar");
const main = document.getElementById("main-content");
let chapters = [];
let activeMode = "chapter-1";
const sessions = new Map();
const mistakeStorageKey = "on-tap-he-dieu-hanh-cau-sai-v1";
let mistakes = new Map();
let wrongView = "overview";
modeToggle.addEventListener("click", () => {
  const open = sidebar.classList.toggle("open");
  modeToggle.setAttribute("aria-expanded", String(open));
});

const make = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};

function shuffled(items) {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
}

function createSession(mode) {
  const all = allQuestions();
  const questions = mode === "all" ? shuffled(all) : all.filter(question => question.chapterId === Number(mode.split("-")[1]));
  return { questions, index: 0, responses: new Map(), finished: false };
}

function allQuestions() {
  return chapters.flatMap(chapter => chapter.questions.map(question => ({
    ...question,
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    key: `${chapter.id}-${question.number}`
  })));
}

function loadMistakes() {
  try {
    const saved = JSON.parse(localStorage.getItem(mistakeStorageKey) || "[]");
    if (!Array.isArray(saved)) return;
    const known = new Map(allQuestions().map(question => [question.key, question]));
    mistakes = new Map(saved.filter(entry => Array.isArray(entry) && entry.length === 2 && known.has(entry[0]) && entry[1] in known.get(entry[0]).options && entry[1] !== known.get(entry[0]).answer));
  } catch { mistakes = new Map(); }
}

function saveMistakes() {
  try { localStorage.setItem(mistakeStorageKey, JSON.stringify([...mistakes])); } catch { /* Keep this session usable if storage is unavailable. */ }
}

function trackAnswer(question, selected) {
  if (selected === question.answer) mistakes.delete(question.key);
  else mistakes.set(question.key, selected);
  saveMistakes();
}

function session() { return sessions.get(activeMode); }
function countChecked(current) { return [...current.responses.values()].filter(response => response.checked).length; }
function countCorrect(current) {
  return current.questions.filter(question => {
    const response = current.responses.get(question.key);
    return response?.checked && response.selected === question.answer;
  }).length;
}

function selectMode(mode) {
  activeMode = mode;
  if (mode === "wrong") wrongView = "overview";
  else if (!sessions.has(mode)) sessions.set(mode, createSession(mode));
  sidebar.classList.remove("open");
  modeToggle.setAttribute("aria-expanded", "false");
  render();
}

function renderModes() {
  modeList.replaceChildren();
  modeList.append(make("div", "mode-group-title", "Ôn tổng hợp"));
  addMode("all", "∞", "Tất cả các chương", "200 câu · trộn ngẫu nhiên");
  addMode("wrong", "!", "Câu làm sai", `${mistakes.size} câu · lưu trên trình duyệt này`);
  modeList.append(make("div", "mode-group-title", "Ôn theo chương"));
  for (const chapter of chapters) addMode(`chapter-${chapter.id}`, String(chapter.id).padStart(2, "0"), chapter.title, "25 câu");
}

function addMode(id, number, title, count) {
  const control = make("button", `mode-button${id === activeMode ? " active" : ""}`);
  control.type = "button";
  control.setAttribute("aria-current", id === activeMode ? "true" : "false");
  control.append(make("span", "mode-number", number));
  const body = make("span", "mode-text");
  body.append(make("span", "mode-title", title), make("span", "mode-count", count));
  control.append(body);
  control.addEventListener("click", () => selectMode(id));
  modeList.append(control);
}

function heading(current) {
  const wrapper = make("div", "page-heading");
  wrapper.append(make("div", "eyebrow", activeMode === "wrong" ? "ÔN LẠI CÂU SAI" : activeMode === "all" ? "ÔN TỔNG HỢP" : "ÔN THEO CHƯƠNG"));
  const title = activeMode === "wrong" ? "Làm lại các câu đã sai" : activeMode === "all" ? "Tổng hợp Windows, Linux & Unix" : chapters[Number(activeMode.split("-")[1]) - 1].title;
  wrapper.append(make("h1", "", title));
  wrapper.append(make("p", "", activeMode === "wrong" ? "Trả lời lại từng câu và kiểm tra đáp án như lượt ôn ban đầu." : activeMode === "all" ? "200 câu từ 8 chương được trộn cho mỗi lượt làm mới." : "Luyện lần lượt 25 câu hỏi của chương này."));
  const stats = make("div", "stats-row");
  for (const [label, value] of [["Đã kiểm tra", countChecked(current)], ["Đúng", countCorrect(current)], ["Tổng số", current.questions.length]]) {
    const pill = make("span", "stat-pill");
    pill.append(document.createTextNode(`${label} `), make("strong", "", String(value)));
    stats.append(pill);
  }
  wrapper.append(stats);
  return wrapper;
}

function button(label, className, action, disabled = false) {
  const control = make("button", `button ${className}`, label);
  control.type = "button";
  control.disabled = disabled;
  control.addEventListener("click", action);
  return control;
}

function renderQuestion(current) {
  const question = current.questions[current.index];
  const response = current.responses.get(question.key) || { selected: null, checked: false };
  const card = make("article", "quiz-card");
  const track = make("div", "progress-track");
  const fill = make("div", "progress-fill");
  fill.style.width = `${100 * countChecked(current) / current.questions.length}%`;
  track.append(fill);
  card.append(track);
  const inner = make("div", "quiz-inner");
  const top = make("div", "question-top");
  top.append(make("span", "question-index", `Câu ${String(current.index + 1).padStart(2, "0")} / ${current.questions.length}`));
  top.append(make("span", "chapter-tag", `Chương ${question.chapterId} · Câu ${question.number}`));
  inner.append(top);
  const fieldset = make("fieldset", "question-fieldset");
  fieldset.append(make("legend", "", question.text));
  const options = make("div", "options");
  let checkButton;
  for (const [letter, text] of Object.entries(question.options)) {
    const label = make("label", "option");
    if (response.checked && letter === question.answer) label.classList.add("correct");
    if (response.checked && letter === response.selected && letter !== question.answer) label.classList.add("wrong");
    const input = make("input");
    input.type = "radio";
    input.name = "answer";
    input.value = letter;
    input.checked = response.selected === letter;
    input.disabled = response.checked;
    input.addEventListener("change", () => {
      current.responses.set(question.key, { selected: letter, checked: false });
      if (checkButton) checkButton.disabled = false;
    });
    label.append(input, make("span", "option-letter", letter), make("span", "option-text", text));
    options.append(label);
  }
  fieldset.append(options);
  inner.append(fieldset);

  if (response.checked) {
    const correct = response.selected === question.answer;
    const feedback = make("div", `feedback ${correct ? "good" : "bad"}`);
    feedback.setAttribute("role", "status");
    feedback.append(make("strong", "", correct ? "Chính xác" : "Chưa đúng"));
    feedback.append(make("p", "", `Đáp án đúng: ${question.answer}. ${question.options[question.answer]}`));
    if (question.note) feedback.append(make("p", "note", question.note));
    if (question.reference) {
      const link = make("a", "", question.reference.label);
      link.href = question.reference.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      feedback.append(link);
    }
    inner.append(feedback);
  }

  const footer = make("div", "quiz-footer");
  const left = make("div", "left-actions");
  left.append(button("Câu trước", "", () => { current.index--; render(); }, current.index === 0));
  const right = make("div", "right-actions");
  if (!response.checked) {
    right.append(button("Bỏ qua", "button-quiet", () => advance(current)));
    checkButton = button("Kiểm tra đáp án", "button-primary", () => {
      const latest = current.responses.get(question.key);
      if (!latest?.selected) return;
      current.responses.set(question.key, { ...latest, checked: true });
      trackAnswer(question, latest.selected);
      render();
    }, !response.selected);
    right.append(checkButton);
  } else {
    right.append(make("span", "progress-caption", `${countChecked(current)} / ${current.questions.length} đã kiểm tra`));
    right.append(button(current.index === current.questions.length - 1 ? "Xem kết quả" : "Câu tiếp theo", "button-primary", () => advance(current)));
  }
  footer.append(left, right);
  inner.append(footer);
  card.append(inner);
  const tip = make("p", "tip", "Bạn có thể quay lại câu trước hoặc bỏ qua câu chưa chắc chắn.");
  return [card, tip];
}

function advance(current) {
  if (current.index < current.questions.length - 1) current.index++;
  else current.finished = true;
  render();
}

function renderWrongOverview() {
  const wrapper = make("div", "page-heading");
  wrapper.append(make("div", "eyebrow", "CÂU LÀM SAI"), make("h1", "", "Xem lại các câu đã sai"));
  wrapper.append(make("p", "", "Danh sách được lưu trên trình duyệt này và cập nhật khi bạn kiểm tra đáp án."));
  const card = make("section", "summary-card");
  const known = new Map(allQuestions().map(question => [question.key, question]));
  const entries = [...mistakes].map(([key, selected]) => ({ question: known.get(key), selected })).filter(entry => entry.question);
  if (!entries.length) {
    card.append(make("h2", "", "Chưa có câu làm sai"));
    card.append(make("p", "score-detail", "Hãy làm bài theo chương hoặc ôn tổng hợp. Những câu trả lời sai sẽ xuất hiện ở đây."));
    return [wrapper, card];
  }
  card.append(make("h2", "", `${entries.length} câu cần ôn lại`));
  const actions = make("div", "summary-actions wrong-actions");
  actions.append(button(`Làm lại ${entries.length} câu`, "button-primary", () => {
    sessions.set("wrong", { questions: entries.map(entry => entry.question), index: 0, responses: new Map(), finished: false });
    wrongView = "quiz";
    render();
  }));
  card.append(actions);
  const list = make("div", "wrong-list");
  for (const { question, selected } of entries) {
    const item = make("article", "wrong-item");
    item.append(make("div", "question-index", `Chương ${question.chapterId} · Câu ${question.number}`));
    item.append(make("h3", "", question.text));
    item.append(make("p", "wrong-choice", `Bạn đã chọn ${selected}. ${question.options[selected]}`));
    item.append(make("p", "correct-choice", `Đáp án đúng ${question.answer}. ${question.options[question.answer]}`));
    if (question.note) item.append(make("p", "note", question.note));
    list.append(item);
  }
  card.append(list);
  return [wrapper, card];
}

function renderSummary(current) {
  const card = make("section", "summary-card");
  card.append(make("div", "eyebrow", "KẾT QUẢ ÔN TẬP"), make("h2", "", "Bạn đã hoàn thành lượt ôn"));
  const checked = countChecked(current);
  const correct = countCorrect(current);
  const score = make("div", "score-block");
  score.append(make("div", "score-number", `${Math.round(100 * correct / current.questions.length)}%`));
  score.append(make("div", "score-detail", `${correct} câu đúng trong ${current.questions.length} câu. Bạn đã kiểm tra ${checked} câu.`));
  card.append(score);
  const stats = make("div", "summary-stats");
  for (const text of [`Đúng: ${correct}`, `Sai: ${checked - correct}`, `Chưa làm: ${current.questions.length - checked}`]) stats.append(make("span", "stat-pill", text));
  card.append(stats);
  const reviewEntries = current.questions.map((question, index) => ({ question, index }));
  const wrong = reviewEntries.filter(({ question }) => {
    const response = current.responses.get(question.key);
    return response?.checked && response.selected !== question.answer;
  });
  const skipped = reviewEntries.filter(({ question }) => !current.responses.get(question.key)?.checked);
  if (wrong.length) {
    const section = make("div", "summary-list");
    section.append(make("h3", "", `Câu trả lời sai (${wrong.length})`));
    for (const { question, index } of wrong) {
      const review = make("button", "review-item");
      review.type = "button";
      const selected = current.responses.get(question.key).selected;
      review.append(make("small", "", `Chương ${question.chapterId} · Câu ${question.number} · Bạn chọn ${selected}, đúng ${question.answer}`));
      review.append(make("span", "", question.text));
      review.addEventListener("click", () => { current.index = index; current.finished = false; render(); });
      section.append(review);
    }
    card.append(section);
  }
  if (skipped.length) {
    const section = make("div", "summary-list");
    section.append(make("h3", "", `Câu chưa làm (${skipped.length})`));
    for (const { question, index } of skipped) {
      const review = make("button", "review-item");
      review.type = "button";
      review.append(make("small", "", `Chương ${question.chapterId} · Câu ${question.number}`));
      review.append(make("span", "", question.text));
      review.addEventListener("click", () => { current.index = index; current.finished = false; render(); });
      section.append(review);
    }
    card.append(section);
  }
  if (!wrong.length && !skipped.length) {
    card.append(make("p", "", "Bạn đã trả lời đúng toàn bộ câu hỏi trong lượt ôn này."));
  }
  const actions = make("div", "summary-actions");
  actions.append(button("Xem lại câu hỏi", "", () => { current.finished = false; current.index = 0; render(); }));
  if (mistakes.size) actions.append(button("Xem các câu làm sai", "", () => selectMode("wrong")));
  actions.append(button("Làm lượt mới", "button-primary", () => {
    if (activeMode === "wrong") sessions.set("wrong", { questions: [...current.questions], index: 0, responses: new Map(), finished: false });
    else sessions.set(activeMode, createSession(activeMode));
    render();
  }));
  card.append(actions);
  return card;
}

function render() {
  renderModes();
  if (activeMode === "wrong" && wrongView === "overview") {
    main.replaceChildren(...renderWrongOverview());
    return;
  }
  const current = session();
  main.replaceChildren(heading(current), ...(current.finished ? [renderSummary(current)] : renderQuestion(current)));
}

fetch("questions.json")
  .then(response => { if (!response.ok) throw new Error("Không tải được bộ câu hỏi."); return response.json(); })
  .then(data => {
    if (!Array.isArray(data) || data.length !== 8 || data.some(chapter => chapter.questions.length !== 25 || chapter.questions.some(question => !question.options[question.answer]))) throw new Error("Dữ liệu câu hỏi chưa đầy đủ.");
    chapters = data;
    loadMistakes();
    selectMode(activeMode);
  })
  .catch(error => {
    modeList.replaceChildren(make("p", "loading-small", "Không tải được nội dung."));
    const card = make("div", "error-card");
    card.append(make("h2", "", "Không thể mở bộ câu hỏi"), make("p", "", error.message), make("p", "", "Hãy tải lại trang để thử lần nữa."));
    main.replaceChildren(card);
  });
