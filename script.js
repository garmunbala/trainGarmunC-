document.addEventListener('DOMContentLoaded', function() {
    // =================== КОНФИГУРАЦИЯ ГАРМОНИ ===================
    const KEYBOARD_LAYOUT = {
        leftColumn: [ // ЛЕВЫЙ СТОЛБЕЦ (нижний ряд, 11 клавиш)
            { note: 'C', octave: 4 }, { note: 'E', octave: 4 }, { note: 'G', octave: 4 },
            { note: 'B', octave: 4 }, { note: 'D', octave: 5 }, { note: 'F', octave: 5 },
            { note: 'A', octave: 5 }, { note: 'C', octave: 6 }, { note: 'E', octave: 6 },
            { note: 'G', octave: 6 }, { note: 'B', octave: 6 }
        ],
        rightColumn: [ // ПРАВЫЙ СТОЛБЕЦ (верхний ряд, 11 клавиш)
            { note: 'D', octave: 4 }, { note: 'F', octave: 4 }, { note: 'A', octave: 4 },
            { note: 'C', octave: 5 }, { note: 'E', octave: 5 }, { note: 'G', octave: 5 },
            { note: 'B', octave: 5 }, { note: 'D', octave: 6 }, { note: 'F', octave: 6 },
            { note: 'A', octave: 6 }, { note: 'C', octave: 7 }
        ]
    };

    // =================== СОПОСТАВЛЕНИЕ КЛАВИШ КЛАВИАТУРЫ ===================
    const KEY_MAPPING = {
        // Правый столбец (верхний ряд)
        'KeyA': 'd4', 'KeyS': 'f4', 'KeyD': 'a4',
        'KeyF': 'c5', 'KeyG': 'e5', 'KeyH': 'g5',
        'KeyJ': 'b5', 'KeyK': 'd6', 'KeyL': 'f6',
        'Semicolon': 'a6', // : (точка с запятой)
        'Quote': 'c7',     // " (кавычка)

        // Левый столбец (нижний ряд)
        'KeyZ': 'c4', 'KeyX': 'e4', 'KeyC': 'g4',
        'KeyV': 'b4', 'KeyB': 'd5', 'KeyN': 'f5',
        'KeyM': 'a5', 'Comma': 'c6',  // ,
        'Period': 'e6',   // .
        'Slash': 'g6',    // /
        'BracketRight': 'b6' // ]
    };

    // =================== СОСТОЯНИЕ ===================
    let state = {
        currentTargetNote: '',
        correctCount: 0,
        wrongCount: 0,
        showNames: true,
        audioLoaded: 0,
        audioTotal: 0,
        audioElements: {}
    };

    // =================== DOM ЭЛЕМЕНТЫ ===================
    const targetNoteEl = document.getElementById('targetNote');
    const columnLeft = document.getElementById('columnLeft');
    const columnRight = document.getElementById('columnRight');
    const correctCountEl = document.getElementById('correctCount');
    const wrongCountEl = document.getElementById('wrongCount');
    const accuracyEl = document.getElementById('accuracy');
    const resetBtn = document.getElementById('resetStats');
    const toggleNamesBtn = document.getElementById('toggleNames');
    const currentSoundEl = document.getElementById('currentSound');

    // =================== ИНИЦИАЛИЗАЦИЯ ===================
    initKeyboard();
    loadAllAudio();
    generateNewNote();
    updateStats();
    updateToggleButton();

    // =================== ОСНОВНЫЕ ФУНКЦИИ ===================

    // 1. СОЗДАНИЕ КЛАВИАТУРЫ
    function initKeyboard() {
        createColumn(columnLeft, KEYBOARD_LAYOUT.leftColumn, 'left');
        createColumn(columnRight, KEYBOARD_LAYOUT.rightColumn, 'right');
    }

    function createColumn(columnElement, layout, side) {
        columnElement.innerHTML = '';
        layout.forEach(key => {
            const noteId = `${key.note.toLowerCase()}${key.octave}`;
            const keyEl = document.createElement('div');
            keyEl.className = 'key';
            keyEl.dataset.note = noteId;
            keyEl.dataset.side = side;
            keyEl.innerHTML = `
                <div class="note-name">${key.note}</div>
                <div class="octave">${key.octave}</div>
            `;
            keyEl.addEventListener('click', () => handleNoteClick(noteId));
            columnElement.appendChild(keyEl);
        });
    }

    // 2. ЗАГРУЗКА ЗВУКОВ
    function loadAllAudio() {
        const allNotes = [...KEYBOARD_LAYOUT.leftColumn, ...KEYBOARD_LAYOUT.rightColumn];
        const uniqueNotes = [...new Set(allNotes.map(k => `${k.note.toLowerCase()}${k.octave}`))];
        state.audioTotal = uniqueNotes.length;
        state.audioLoaded = 0;

        uniqueNotes.forEach(noteId => {
            const audio = new Audio();
            audio.src = `sounds/${noteId}.mp3`; // МЕНЯЙ НА .wav ЕСЛИ НАДО
            audio.preload = 'auto';
            
            audio.addEventListener('canplaythrough', () => {
                state.audioLoaded++;
                updateAudioLoadStatus();
            });

            audio.addEventListener('error', () => {
                console.warn(`Не удалось загрузить: sounds/${noteId}.mp3`);
                state.audioLoaded++;
                updateAudioLoadStatus();
            });

            state.audioElements[noteId] = audio;
        });
    }

    function updateAudioLoadStatus() {
        const percent = Math.round((state.audioLoaded / state.audioTotal) * 100);
        currentSoundEl.textContent = `Загружено ${state.audioLoaded}/${state.audioTotal} (${percent}%)`;
        if (state.audioLoaded === state.audioTotal) {
            currentSoundEl.innerHTML = '<span style="color:#72efdd">Все звуки загружены! ✓</span>';
        }
    }

    // 3. ГЕНЕРАЦИЯ НОВОЙ НОТЫ
    function generateNewNote() {
        const allNotes = [...KEYBOARD_LAYOUT.leftColumn, ...KEYBOARD_LAYOUT.rightColumn];
        const randomKey = allNotes[Math.floor(Math.random() * allNotes.length)];
        state.currentTargetNote = `${randomKey.note.toLowerCase()}${randomKey.octave}`;
        targetNoteEl.textContent = `${randomKey.note}${randomKey.octave}`;
    }

    // 4. ОБРАБОТКА НАЖАТИЯ (МЫШЬ И КЛАВИАТУРА)
    function handleNoteClick(noteId) {
        processNoteInput(noteId);
    }

    function handleKeyPress(noteId) {
        processNoteInput(noteId);
    }

    function processNoteInput(noteId) {
        const keyEl = document.querySelector(`.key[data-note="${noteId}"]`);
        if (!keyEl) return;
        
        // Анимация
        keyEl.classList.add('active');
        setTimeout(() => keyEl.classList.remove('active'), 150);

        // Проверка
        const isCorrect = noteId === state.currentTargetNote;
        if (isCorrect) {
            state.correctCount++;
        } else {
            state.wrongCount++;
        }

        // Звук
        playSound(noteId);

        // Обновление
        updateStats();
        if (isCorrect) {
            setTimeout(generateNewNote, 300);
        }
    }

    // 5. ВОСПРОИЗВЕДЕНИЕ ЗВУКА
    function playSound(noteId) {
        const audio = state.audioElements[noteId];
        if (audio) {
            audio.currentTime = 0;
            audio.play().catch(e => {
                console.log("Кликни по странице для разблокировки звука");
            });
        }
    }

    // 6. ОБНОВЛЕНИЕ СТАТИСТИКИ
    function updateStats() {
        correctCountEl.textContent = state.correctCount;
        wrongCountEl.textContent = state.wrongCount;
        
        const total = state.correctCount + state.wrongCount;
        const accuracy = total > 0 ? Math.round((state.correctCount / total) * 100) : 0;
        accuracyEl.textContent = `${accuracy}%`;
    }

    // 7. ПЕРЕКЛЮЧЕНИЕ ВИДИМОСТИ НАЗВАНИЙ
    function toggleNamesVisibility() {
        state.showNames = !state.showNames;
        const keys = document.querySelectorAll('.key');
        keys.forEach(key => {
            key.classList.toggle('hide-names', !state.showNames);
        });
        updateToggleButton();
    }

    function updateToggleButton() {
        toggleNamesBtn.innerHTML = state.showNames 
            ? '<i class="fas fa-eye-slash"></i> Скрыть названия нот'
            : '<i class="fas fa-eye"></i> Показать названия нот';
    }

    // =================== ОБРАБОТЧИКИ СОБЫТИЙ ===================
    // Клавиатура
    document.addEventListener('keydown', (e) => {
        // Пропускаем Ctrl, Alt, Win
        if (e.ctrlKey || e.altKey || e.metaKey) return;

        const noteId = KEY_MAPPING[e.code];
        if (noteId) {
            e.preventDefault();
            handleKeyPress(noteId);
            return;
        }

        // Горячие клавиши
        if (e.code === 'Space') {
            e.preventDefault();
            generateNewNote();
        }
        if (e.code === 'KeyH' && e.ctrlKey) {
            e.preventDefault();
            toggleNamesVisibility();
        }
    });

    // Кнопки
    resetBtn.addEventListener('click', () => {
        state.correctCount = 0;
        state.wrongCount = 0;
        updateStats();
        generateNewNote();
    });

    toggleNamesBtn.addEventListener('click', toggleNamesVisibility);

    // Отладка
    window.debugState = () => {
        console.log('Состояние:', state);
        console.log('Текущая нота:', state.currentTargetNote);
        console.log('Загружено звуков:', state.audioLoaded + '/' + state.audioTotal);
    };
});