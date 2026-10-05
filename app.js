const clippyTexts = {
    default: "Привет! Я Срепыч! Выбери иконку чтобы начать! 🎁",
    spin: "О, выбрать подарок? Классика! Укажи бюджет — я подберу что-то годное! 🎲",
    certificate: "Хочешь подарить сертификат? Это не просто деньги — это стильно! 💸",
    goals: "Скинуться на великое? Вместе мы сила! 🧩",
    spinning: "Кру-у-у-тим... Держись! 🎰",
    result: "Вуаля! Смотри что нашёл! Подтверждай или крутим ещё? 🎁",
    approved: "✅ Подтверждено! Список в буфере! Записано в таблицу! 🎉",
    noMore: "Всё! Больше в этом бюджете нихуя нет! 😂 Бери что дали!",
    restart: "Начать заново? Жми кнопку! 🔄",
    error: "Ой, что-то пошло не так... 🔧",
    intro: "Привет! Я Срепыш! Слушай что к чему: 🎁 Выбрать подарок — это забронировать что-то из вишлиста. 💸 Подарить сертификат — это не просто деньги, а с душой! 🧩 Скинуться на великое — это помочь накопить на что-то дорогое и важное! Выбирай!"
};

window.currentGifts = [];
window.shownGiftIds = new Set();
window.lastApprovedData = null;
window.rightPanelActive = false;
window.currentGoal = null;

function updateClippy(text) {
    const clippy = document.getElementById('clippy-text');
    if (clippy) clippy.textContent = text;
}

function closeModal() {
    const overlay = document.getElementById('modal-overlay');
    if (overlay) overlay.style.display = 'none';
    
    setLeftPanelDimmed(false);
    setRightPanelDimmed(false);
    
    const actionBar = document.getElementById('action-bar');
    if (actionBar) actionBar.style.display = 'none';
    
    // Восстанавливаем левую панель
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    
    if (leftPanel) {
        leftPanel.style.display = 'block';
        leftPanel.classList.remove('dimmed');
    }
    if (rightPanel) {
        rightPanel.style.width = '';
        rightPanel.style.flex = '1';
        rightPanel.classList.remove('dimmed');
    }
    
    // Очищаем контент
    const resultContent = document.getElementById('result-content');
    if (resultContent) {
        resultContent.innerHTML = `
            <p style="color: #808080; text-align: center; padding: 40px;">
                Нажми "Подобрать случайный подарок"<br>или "Показать доступные"
            </p>
        `;
    }
    
    window.shownGiftIds.clear();
    window.currentGifts = [];
    window.lastApprovedData = null;
    window.rightPanelActive = false;
    window.currentGoal = null;
    
    updateClippy(clippyTexts.default);
}

function updateStats() {
    const locked = window.currentGifts.filter(g => g._locked);
    const count = locked.length;
    const total = locked.reduce((sum, g) => sum + (parseInt(g.price_rub) || 0), 0);
    
    document.getElementById('stats-count').textContent = count;
    document.getElementById('stats-total').textContent = total;
}

function renderGiftsTable(gifts, showCheckbox = true) {
    let html = '<h3 style="margin-top: 0;">🎁 Подарки:</h3>';
    html += '<div class="gifts-table-container">';
    html += '<table class="gifts-table">';
    html += '<tr><th style="width: 40px;">✓</th><th style="width: 100px;">🖼️</th><th>Название</th><th style="width: 80px;">Цена</th><th>Категория</th><th>Коммент</th><th>Ссылка</th></tr>';
    
    gifts.forEach((gift, idx) => {
        const price = parseInt(gift.price_rub) || 0;
        
        const checkbox = showCheckbox 
            ? `<td><input type="checkbox" class="gift-lock" data-idx="${idx}" ${gift._locked ? 'checked' : ''} title="Зафиксировать"></td>`
            : '<td>—</td>';
        
        const imageCell = gift.image_url 
            ? `<td><img src="${gift.image_url}" alt="${gift.name}" onerror="this.outerHTML='<div class=\\'image-placeholder\\'>🖼️</div>'"></td>`
            : '<td><div class="image-placeholder">🖼️</div></td>';
        
        const link = gift.url 
            ? `<a href="${gift.url}" target="_blank">🔗 Открыть</a>`
            : '—';
        
        html += `<tr data-id="${gift.id}">
            ${checkbox}
            ${imageCell}
            <td><strong>${gift.name}</strong></td>
            <td>${price}₽</td>
            <td>${gift.category || '—'}</td>
            <td>${gift.note || '—'}</td>
            <td>${link}</td>
        </tr>`;
    });
    
    html += '</table></div>';
    
    return html;
}

function renderGoalsGrid(goals) {
    let html = '<div class="goals-grid">';
    
    goals.forEach((goal, idx) => {
        const progress = goal.progress || 0;
        const remaining = goal.target_rub - goal.pledged_rub;
        
        html += `
            <div class="goal-card" data-goal-id="${goal.id}">
                ${goal.image_url ? `<img src="${goal.image_url}" alt="${goal.title}" class="goal-image" onerror="this.style.display='none'">` : '<div class="image-placeholder">🖼️</div>'}
                <h4 style="margin: 10px 0 5px 0; font-size: 15px;">${goal.title}</h4>
                <p style="font-size: 13px; color: #666; margin: 5px 0;">${goal.note || goal.category || ''}</p>
                
                <div class="progress-container" style="margin: 15px 0;">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${progress}%;"></div>
                    </div>
                    <div style="text-align: center; font-size: 13px; margin-top: 5px; font-weight: bold;">
                        ${progress}% (${goal.pledged_rub} / ${goal.target_rub}₽)
                    </div>
                </div>
                
                <p style="font-size: 13px; color: #666;">Осталось: <strong>${remaining}₽</strong></p>
                
                <button class="win95 goal-contribute-btn" data-goal-id="${goal.id}" data-goal-title="${goal.title}" data-remaining="${remaining}" style="width: 100%; margin-top: 10px; background: #008000; color: white;">
                    💸 Внести вклад
                </button>
            </div>
        `;
    });
    
    html += '</div>';
    
    return html;
}

function generateGiftsText(gifts) {
    const locked = gifts.filter(g => g._locked);
    
    if (locked.length === 0) {
        return '❌ Ничего не выбрано!';
    }
    
    let text = '🎁 ZAKATATOR.EXE — Твой список покупок:\n\n';
    
    locked.forEach((gift, i) => {
        const price = parseInt(gift.price_rub) || 0;
        text += `${i + 1}. ${gift.name}\n`;
        text += `   Цена: ${price}₽\n`;
        text += `   Категория: ${gift.category || '—'}\n`;
        text += `   Коммент: ${gift.note || '—'}\n`;
        if (gift.url) text += `   Ссылка: ${gift.url}\n`;
        text += '\n';
    });
    
    const total = locked.reduce((sum, g) => sum + (parseInt(g.price_rub) || 0), 0);
    text += `ИТОГО: ${total}₽\n\n`;
    text += `📅 ${new Date().toLocaleString('ru-RU')}\n`;
    
    return text;
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        return true;
    } catch (err) {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    }
}

function getLockedGifts() {
    return window.currentGifts.filter(g => g._locked);
}

function setLeftPanelDimmed(dimmed) {
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) {
        if (dimmed) {
            leftPanel.classList.add('dimmed');
        } else {
            leftPanel.classList.remove('dimmed');
        }
    }
}

function setRightPanelDimmed(dimmed) {
    const rightPanel = document.getElementById('right-panel');
    if (rightPanel) {
        if (dimmed) {
            rightPanel.classList.add('dimmed');
        } else {
            rightPanel.classList.remove('dimmed');
        }
    }
}

function activateLeftPanel() {
    window.rightPanelActive = false;
    setLeftPanelDimmed(false);
    setRightPanelDimmed(true);
}

function activateRightPanel() {
    window.rightPanelActive = true;
    setLeftPanelDimmed(true);
    setRightPanelDimmed(false);
}

function showActionBar(show) {
    const actionBar = document.getElementById('action-bar');
    if (actionBar) actionBar.style.display = show ? 'block' : 'none';
}

function showApprovedTable(data, gifts) {
    const resultContent = document.getElementById('result-content');
    
    let itemsHtml = '<ul style="font-size: 13px; line-height: 1.6;">';
    gifts.forEach(gift => {
        const price = parseInt(gift.price_rub) || 0;
        const link = gift.url ? `<a href="${gift.url}" target="_blank">🔗</a>` : '';
        itemsHtml += `<li><strong>${gift.name}</strong> — ${price}₽ ${link}</li>`;
    });
    itemsHtml += '</ul>';
    
    resultContent.innerHTML = `
        <h3 style="margin-top: 0; color: #008000;">✅ Подтверждено!</h3>
        <div style="background: #f0f0f0; border: 2px solid #000; border-right-color: #fff; border-bottom-color: #fff; padding: 15px; margin: 15px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Сумма:</strong> ${data.total_rub}₽</p>
            <p style="margin: 0 0 10px 0;"><strong>Товаров:</strong> ${gifts.length} шт</p>
        </div>
        <h4 style="margin: 15px 0 10px 0;">Выбрано:</h4>
        ${itemsHtml}
        <div style="margin-top: 20px; text-align: right;">
            <button id="btn-copy-approved" class="win95" style="background: #008000; color: white;">📋 Скопировать список</button>
            <button id="btn-close-approved" class="win95">Закрыть</button>
        </div>
    `;
    
    document.getElementById('btn-copy-approved').onclick = () => {
        const text = generateGiftsText({ filter: () => gifts.map(g => ({ ...g, _locked: true })) });
        copyToClipboard(text).then(() => {
            alert('✅ Скопировано в буфер!');
        });
    };
    
    document.getElementById('btn-close-approved').onclick = closeModal;
}

function resetSelection() {
    window.currentGifts = [];
    window.shownGiftIds = new Set();
    updateStats();
}

window.loadGoals = async function() {
    updateClippy("Загружаем великие цели... 🧩");
    
    try {
        const response = await fetch(`/api/goals`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        let goals = await response.json();
        
        goals = goals.filter(g => g.status === 'open');
        
        if (!goals || goals.length === 0) {
            document.getElementById('result-content').innerHTML = `
                <p style="font-size: 16px; text-align: center; padding: 40px; color: #808080;">
                    😕 <strong>Ничего нет!</strong><br><br>
                    Нет активных целей для сбора!<br><br>
                    <em>Заходи позже!</em>
                </p>
            `;
            updateClippy("Пока нет активных целей 😕");
            return;
        }
        
        // Скрываем левую панель, делаем правую на весь экран
        const leftPanel = document.getElementById('left-panel');
        const rightPanel = document.getElementById('right-panel');
        
        if (leftPanel) leftPanel.style.display = 'none';
        if (rightPanel) {
            rightPanel.style.width = '100%';
            rightPanel.style.flex = 'none';
        }
        
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = renderGoalsGrid(goals);
        
        // Обработчики кнопок "Внести вклад"
        document.querySelectorAll('.goal-contribute-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const goalId = btn.getAttribute('data-goal-id');
                const goalTitle = btn.getAttribute('data-goal-title');
                const remaining = parseInt(btn.getAttribute('data-remaining'));
                
                showContributionForm(goalId, goalTitle, remaining);
            });
        });
        
        showActionBar(false);
        updateClippy("Выбирай цель и вноси вклад! 💸");
        
    } catch (error) {
        console.error('Load goals error:', error);
        alert(`❌ Ошибка: ${error.message}`);
        updateClippy(clippyTexts.error);
    }
};

function showContributionForm(goalId, goalTitle, maxAmount) {
    const resultContent = document.getElementById('result-content');
    
    resultContent.innerHTML = `
        <h3 style="margin-top: 0;">💸 Вклад в "${goalTitle}"</h3>
        
        <div style="background: #f0f0f0; border: 2px solid #000; border-right-color: #fff; border-bottom-color: #fff; padding: 20px; margin: 20px 0;">
            <label style="font-size: 14px; display: block; margin-bottom: 10px; font-weight: bold;">
                Твоё имя (необязательно):
            </label>
            <input type="text" id="contributor-name" class="win95" placeholder="Аноним" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <label style="font-size: 14px; display: block; margin-top: 15px; margin-bottom: 10px; font-weight: bold;">
                Сумма вклада (₽):
            </label>
            <input type="number" id="contribution-amount" class="win95" value="1000" min="1" max="${maxAmount}" step="100" style="width: 100%; padding: 8px; box-sizing: border-box;">
            
            <p style="font-size: 13px; color: #666; margin-top: 10px;">
                Максимум: ${maxAmount}₽
            </p>
        </div>
        
        <div style="margin-top: 20px; text-align: right;">
            <button id="btn-confirm-contribution" class="win95" style="background: #008000; color: white; padding: 10px 30px;">✅ Внести вклад</button>
            <button id="btn-cancel-contribution" class="win95" style="padding: 10px 30px;">Отмена</button>
        </div>
    `;
    
    document.getElementById('btn-cancel-contribution').onclick = () => {
        window.loadGoals();
    };
    
    document.getElementById('btn-confirm-contribution').onclick = async () => {
        const contributorName = document.getElementById('contributor-name').value || 'Аноним';
        const amountRub = parseInt(document.getElementById('contribution-amount').value);
        
        if (!amountRub || amountRub < 1) {
            alert('Введи сумму от 1₽!');
            return;
        }
        
        if (amountRub > maxAmount) {
            alert(`Максимум ${maxAmount}₽!`);
            return;
        }
        
        try {
            const response = await fetch(`/api/contribute?goal_id=${goalId}&amount_rub=${amountRub}&contributor_name=${encodeURIComponent(contributorName)}`, {
                method: 'POST'
            });
            
            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || `HTTP ${response.status}`);
            }
            
            const data = await response.json();
            
            showCertificate(goalTitle, amountRub, contributorName);
            
        } catch (error) {
            console.error('Contribute error:', error);
            alert(`❌ Ошибка: ${error.message}`);
        }
    };
}

function showCertificate(goalTitle, amountRub, contributorName) {
    const resultContent = document.getElementById('result-content');
    
    resultContent.innerHTML = `
        <div style="background: linear-gradient(135deg, #fff 0%, #f0f0f0 100%); border: 4px double #000; border-right-color: #fff; border-bottom-color: #fff; padding: 30px; margin: 20px 0; text-align: center;">
            <h2 style="color: #000080; margin: 0 0 20px 0; font-size: 22px;">🏆 Сертификат участника</h2>
            
            <p style="font-size: 16px; margin: 20px 0; line-height: 1.6;">
                Настоящим подтверждается, что<br>
                <strong style="font-size: 18px; color: #000080;">${contributorName}</strong><br>
                внес(ла) непосильный вклад в размере<br>
                <strong style="font-size: 24px; color: #008000;">${amountRub}₽</strong><br>
                в приобретение<br>
                <strong style="font-size: 18px; color: #800000;">"${goalTitle}"</strong>
            </p>
            
            <p style="font-size: 14px; color: #666; margin: 30px 0 10px 0;">
                Для тебя, дурашка! 💖
            </p>
            
            <p style="font-size: 13px; color: #808080; margin-top: 30px;">
                📅 ${new Date().toLocaleString('ru-RU')}
            </p>
        </div>
        
        <div style="text-align: center; margin-top: 20px;">
            <button id="btn-copy-certificate" class="win95" style="background: #008000; color: white; padding: 10px 30px;">📋 Скопировать</button>
            <button id="btn-close-certificate" class="win95" style="padding: 10px 30px;">Закрыть</button>
        </div>
    `;
    
    document.getElementById('btn-copy-certificate').onclick = () => {
        const text = `🏆 СЕРТИФИКАТ УЧАСТНИКА\n\n${contributorName} внес(ла) ${amountRub}₽ в "${goalTitle}"\n\nДля тебя, дурашка! 💖\n\n📅 ${new Date().toLocaleString('ru-RU')}`;
        copyToClipboard(text).then(() => {
            alert('✅ Скопировано в буфер!');
        });
    };
    
    document.getElementById('btn-close-certificate').onclick = closeModal;
}

window.spinGift = async function() {
    updateClippy(clippyTexts.spinning);
    
    const budget = document.getElementById('budget').value;
    const category = document.getElementById('category').value;
    
    if (!budget || budget < 100) {
        alert('Введи бюджет от 100₽!');
        return;
    }
    
    try {
        const locked = getLockedGifts();
        const lockedIds = locked.map(g => g.id);
        
        const excludeIds = [...lockedIds, ...Array.from(window.shownGiftIds)];
        const previousIds = excludeIds.length > 0 ? excludeIds.join(',') : null;
        
        const url = `/api/spin?budget=${budget}&category=${category}&limit=5${previousIds ? `&previous_ids=${previousIds}` : ''}`;
        
        const response = await fetch(url, { method: 'POST' });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const data = await response.json();
        let gifts = data.gifts;
        
        if (!gifts || gifts.length === 0) {
            document.getElementById('result-content').innerHTML = `
                <p style="font-size: 16px; text-align: center; padding: 40px; color: #808080;">
                    😂 <strong>Всё!</strong><br><br>
                    В этом бюджете и категории<br>
                    больше нихуя нет!<br><br>
                    <em>Меняй бюджет или категорию!</em>
                </p>
                <div style="text-align: center; margin-top: 20px;">
                    <button id="btn-restart" class="win95" style="background: #008000; color: white;">🔄 Начать заново</button>
                </div>
            `;
            
            document.getElementById('btn-restart').onclick = () => {
                resetSelection();
                setLeftPanelDimmed(false);
                setRightPanelDimmed(false);
                showActionBar(false);
                document.getElementById('result-content').innerHTML = `
                    <p style="color: #808080; text-align: center; padding: 40px;">
                        Нажми "Подобрать случайный подарок"<br>или "Показать доступные"
                    </p>
                `;
                updateClippy(clippyTexts.default);
            };
            
            updateClippy(clippyTexts.restart);
            return;
        }
        
        gifts = gifts.map(g => ({ ...g, _locked: false }));
        gifts.forEach(g => window.shownGiftIds.add(g.id));
        
        window.currentGifts = [...locked, ...gifts];
        
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = `
            ${renderGiftsTable(window.currentGifts, true)}
        `;
        
        activateRightPanel();
        showActionBar(true);
        updateStats();
        
        document.querySelectorAll('.gift-lock').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx = parseInt(cb.getAttribute('data-idx'));
                if (window.currentGifts && window.currentGifts[idx]) {
                    window.currentGifts[idx]._locked = cb.checked;
                    updateStats();
                }
            });
        });
        
        document.getElementById('btn-reroll').onclick = spinGift;
        document.getElementById('btn-copy').onclick = approveGifts;
        
        updateClippy(clippyTexts.result);
        
    } catch (error) {
        console.error('Spin error:', error);
        alert(`❌ Ошибка: ${error.message}`);
        updateClippy(clippyTexts.error);
    }
};

window.showAllGifts = async function() {
    resetSelection();
    
    updateClippy(clippyTexts.spinning);
    
    const budget = document.getElementById('budget').value;
    const category = document.getElementById('category').value;
    
    if (!budget || budget < 100) {
        alert('Введи бюджет от 100₽!');
        return;
    }
    
    try {
        const response = await fetch(`/api/wishlist`);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        let allGifts = await response.json();
        
        allGifts = allGifts.filter(g => g.status === 'available');
        
        if (category) {
            allGifts = allGifts.filter(g => g.category.toLowerCase() === category.toLowerCase());
        }
        
        allGifts = allGifts.filter(g => parseInt(g.price_rub) <= parseInt(budget));
        
        if (!allGifts || allGifts.length === 0) {
            document.getElementById('result-content').innerHTML = `
                <p style="font-size: 16px; text-align: center; padding: 40px; color: #808080;">
                    😕 <strong>Ничего нет!</strong><br><br>
                    В этом бюджете и категории<br>
                    доступных подарков нет!<br><br>
                    <em>Меняй бюджет или категорию!</em>
                </p>
            `;
            updateClippy(clippyTexts.noMore);
            return;
        }
        
        window.currentGifts = allGifts.map(g => ({ ...g, _locked: false }));
        window.shownGiftIds = new Set(allGifts.map(g => g.id));
        
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = `
            ${renderGiftsTable(window.currentGifts, true)}
        `;
        
        activateRightPanel();
        showActionBar(true);
        updateStats();
        
        document.querySelectorAll('.gift-lock').forEach(cb => {
            cb.addEventListener('change', () => {
                const idx = parseInt(cb.getAttribute('data-idx'));
                if (window.currentGifts && window.currentGifts[idx]) {
                    window.currentGifts[idx]._locked = cb.checked;
                    updateStats();
                }
            });
        });
        
        document.getElementById('btn-copy').onclick = approveGifts;
        
        updateClippy(clippyTexts.result);
        
    } catch (error) {
        console.error('Show all error:', error);
        alert(`❌ Ошибка: ${error.message}`);
        updateClippy(clippyTexts.error);
    }
};

window.approveGifts = async function() {
    const gifts = getLockedGifts();
    if (!gifts || gifts.length === 0) {
        const resultContent = document.getElementById('result-content');
        resultContent.innerHTML = `
            <div style="text-align: center; padding: 60px 20px;">
                <p style="font-size: 48px; margin: 0 0 20px 0;">⚠️</p>
                <h3 style="margin: 0 0 15px 0;">Ничего не выбрано!</h3>
                <p style="color: #666; margin: 0 0 30px 0;">
                    Отметь галочкой подарки которые хочешь подтвердить
                </p>
                <button id="btn-ok-no-selection" class="win95" style="background: #008000; color: white;">OK</button>
            </div>
        `;
        
        document.getElementById('btn-ok-no-selection').onclick = () => {
            activateRightPanel();
            showActionBar(true);
            const resultContent = document.getElementById('result-content');
            resultContent.innerHTML = `
                ${renderGiftsTable(window.currentGifts, true)}
            `;
            updateStats();
            
            document.querySelectorAll('.gift-lock').forEach(cb => {
                cb.addEventListener('change', () => {
                    const idx = parseInt(cb.getAttribute('data-idx'));
                    if (window.currentGifts && window.currentGifts[idx]) {
                        window.currentGifts[idx]._locked = cb.checked;
                        updateStats();
                    }
                });
            });
            
            document.getElementById('btn-reroll').onclick = spinGift;
            document.getElementById('btn-copy').onclick = approveGifts;
        };
        
        showActionBar(false);
        setLeftPanelDimmed(false);
        setRightPanelDimmed(false);
        
        updateClippy("Отметь галочкой что хочешь! ☝️");
        return;
    }
    
    updateClippy(clippyTexts.approved);
    
    try {
        const itemIds = gifts.map(g => g.id).join(',');
        const totalRub = gifts.reduce((sum, g) => sum + (parseInt(g.price_rub) || 0), 0);
        
        const response = await fetch('/api/reserve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                item_ids: itemIds,
                total_rub: totalRub
            })
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        window.lastApprovedData = data;
        
        const text = generateGiftsText(window.currentGifts);
        await copyToClipboard(text);
        
        showApprovedTable(data, gifts);
        showActionBar(false);
        setLeftPanelDimmed(false);
        setRightPanelDimmed(false);
        
        updateClippy(clippyTexts.approved);
        
    } catch (error) {
        console.error('Approve error:', error);
        updateClippy(clippyTexts.error);
        alert(`❌ Ошибка: ${error.message}`);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    console.log('ZAKATATOR.EXE запущен!');
    
    // Показываем интро от Срепыча при загрузке
    updateClippy(clippyTexts.intro);
    
    const leftPanel = document.getElementById('left-panel');
    if (leftPanel) {
        leftPanel.addEventListener('click', () => {
            if (window.rightPanelActive) {
                activateLeftPanel();
            }
        });
    }
    
    document.querySelectorAll('.icon').forEach(icon => {
        icon.addEventListener('click', () => {
            const mode = icon.getAttribute('data-mode');
            const overlay = document.getElementById('modal-overlay');
            
            if (!overlay) return;
            
            overlay.style.display = 'flex';
            
            // СБРОС перед открытием
            resetSelection();
            window.lastApprovedData = null;
            setLeftPanelDimmed(false);
            setRightPanelDimmed(false);
            showActionBar(false);
            window.rightPanelActive = false;
            
            // Восстанавливаем левую панель
            const leftPanel = document.getElementById('left-panel');
            const rightPanel = document.getElementById('right-panel');
            
            if (leftPanel) {
                leftPanel.style.display = 'block';
                leftPanel.classList.remove('dimmed');
            }
            if (rightPanel) {
                rightPanel.style.width = '';
                rightPanel.style.flex = '1';
                rightPanel.classList.remove('dimmed');
            }
            
            // Очищаем контент
            const resultContent = document.getElementById('result-content');
            if (resultContent) {
                resultContent.innerHTML = `
                    <p style="color: #808080; text-align: center; padding: 40px;">
                        Нажми "Подобрать случайный подарок"<br>или "Показать доступные"
                    </p>
                `;
            }
            
            if (mode === 'spin') {
                document.getElementById('modal-title').textContent = '🎲 Выбрать подарок';
                updateClippy(clippyTexts.spin);
                
                document.getElementById('btn-spin-execute').onclick = () => {
                    resetSelection();
                    spinGift();
                };
                document.getElementById('btn-show-all').onclick = () => {
                    resetSelection();
                    showAllGifts();
                };
                
            } else if (mode === 'certificate') {
                document.getElementById('modal-title').textContent = '💸 Подарить сертификат';
                updateClippy(clippyTexts.certificate);
                alert('Режим в разработке! 💸');
                closeModal();
                
            } else if (mode === 'goals') {
                document.getElementById('modal-title').textContent = '🧩 Скинуться на великое';
                updateClippy(clippyTexts.goals);
                window.loadGoals();
            }
        });
    });
    
    document.getElementById('modal-close').onclick = closeModal;
});