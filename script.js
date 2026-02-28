// ==========================================
// EXPENSE TRACKER APPLICATION
// Production-Ready Frontend Application
// ==========================================

/**
 * Application State Manager
 * Handles all data persistence and calculations
 */
class StateManager {
    constructor() {
        this.storageKey = 'fintrack_transactions';
        this.themeKey = 'fintrack_theme';
        this.transactions = this.loadFromStorage();
        this.currentMonth = this.getCurrentMonth();
    }

    // ===== STORAGE OPERATIONS =====

    loadFromStorage() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error loading from storage:', error);
            return [];
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.transactions));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    clearAllData() {
        this.transactions = [];
        this.saveToStorage();
    }

    exportToJSON() {
        return JSON.stringify(this.transactions, null, 2);
    }

    // ===== TRANSACTION OPERATIONS =====

    addTransaction(transaction) {
        const newTransaction = {
            id: this.generateId(),
            type: transaction.type,
            amount: parseFloat(transaction.amount),
            category: transaction.category,
            date: transaction.date,
            description: transaction.description,
            createdAt: new Date().toISOString()
        };

        this.transactions.push(newTransaction);
        this.saveToStorage();
        return newTransaction;
    }

    deleteTransaction(id) {
        this.transactions = this.transactions.filter(t => t.id !== id);
        this.saveToStorage();
    }

    getFilteredTransactions(month = this.currentMonth) {
        if (!month) return this.transactions;

        return this.transactions.filter(t => {
            const transactionMonth = t.date.substring(0, 7);
            return transactionMonth === month;
        });
    }

    getTransactionsByCategory(category, month = this.currentMonth) {
        return this.getFilteredTransactions(month).filter(t => t.category === category);
    }

    // ===== CALCULATION METHODS =====

    calculateTotals(month = this.currentMonth) {
        const filtered = this.getFilteredTransactions(month);

        const income = filtered
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const expenses = filtered
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            income,
            expenses,
            balance: income - expenses,
            savingsRate: income > 0 ? ((income - expenses) / income * 100).toFixed(2) : 0
        };
    }

    getCategoryBreakdown(month = this.currentMonth) {
        const filtered = this.getFilteredTransactions(month);
        const expenses = filtered.filter(t => t.type === 'expense');

        const breakdown = {};
        expenses.forEach(transaction => {
            if (!breakdown[transaction.category]) {
                breakdown[transaction.category] = 0;
            }
            breakdown[transaction.category] += transaction.amount;
        });

        const total = Object.values(breakdown).reduce((sum, val) => sum + val, 0);

        return Object.entries(breakdown)
            .map(([category, amount]) => ({
                category,
                amount,
                percentage: total > 0 ? ((amount / total) * 100).toFixed(2) : 0
            }))
            .sort((a, b) => b.amount - a.amount);
    }

    // ===== UTILITY METHODS =====

    generateId() {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getCurrentMonth() {
        const today = new Date();
        return today.toISOString().substring(0, 7);
    }

    setCurrentMonth(month) {
        this.currentMonth = month;
    }

    getTheme() {
        return localStorage.getItem(this.themeKey) || 'light';
    }

    setTheme(theme) {
        localStorage.setItem(this.themeKey, theme);
    }
}

/**
 * UI Renderer
 * Handles all DOM updates and rendering
 */
class UIRenderer {
    constructor(stateManager) {
        this.state = stateManager;
        this.expenseCategories = ['Food', 'Rent', 'Travel', 'Shopping', 'Bills', 'Other'];
        this.incomeCategories = ['Salary', 'Freelance', 'Investment', 'Gift', 'Other'];
    }

    // ===== INITIALIZATION =====

    initializeUI() {
        this.setupCategorySelects();
        this.setTodayAsDefaultDate();
        this.loadTheme();
        this.renderDashboard();
    }

    setupCategorySelects() {
        this.updateCategoryOptions('income');
    }

    updateCategoryOptions(type) {
        const select = document.getElementById('category');
        const categories = type === 'income' ? this.incomeCategories : this.expenseCategories;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Select Category</option>';

        categories.forEach(cat => {
            const option = document.createElement('option');
            option.value = cat;
            option.textContent = cat;
            select.appendChild(option);
        });

        if (currentValue && categories.includes(currentValue)) {
            select.value = currentValue;
        }
    }

    setTodayAsDefaultDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
    }

    // ===== DASHBOARD RENDERING =====

    renderDashboard() {
        this.updateSummaryCards();
        this.renderCategoryBreakdown();
        this.renderTransactionsTable();
        this.renderAnalytics();
    }

    updateSummaryCards() {
        const totals = this.state.calculateTotals(this.state.currentMonth);

        document.getElementById('totalIncome').textContent = this.formatCurrency(totals.income);
        document.getElementById('totalExpenses').textContent = this.formatCurrency(totals.expenses);
        document.getElementById('netBalance').textContent = this.formatCurrency(totals.balance);
        document.getElementById('savingsRate').textContent = `${totals.savingsRate}%`;

        // Update balance color based on positive/negative
        const balanceEl = document.getElementById('netBalance');
        if (totals.balance >= 0) {
            balanceEl.style.color = 'var(--success)';
        } else {
            balanceEl.style.color = 'var(--danger)';
        }
    }

    renderCategoryBreakdown() {
        const breakdown = this.state.getCategoryBreakdown(this.state.currentMonth);
        const container = document.getElementById('categoryBreakdown');

        if (breakdown.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <p>No spending data yet</p>
                </div>
            `;
            return;
        }

        const totalAmount = breakdown.reduce((sum, item) => sum + item.amount, 0);

        container.innerHTML = breakdown.map(item => `
            <div class="category-item">
                <div class="category-info">
                    <div class="category-name">${this.escapeHtml(item.category)}</div>
                    <div class="category-bar">
                        <div class="category-bar-fill" style="width: ${item.percentage}%"></div>
                    </div>
                </div>
                <div class="category-amount">
                    ${this.formatCurrency(item.amount)}
                    <div class="category-percent">${item.percentage}%</div>
                </div>
            </div>
        `).join('');
    }

    renderTransactionsTable() {
        const transactions = this.state.getFilteredTransactions(this.state.currentMonth);
        const tbody = document.getElementById('transactionsBody');

        if (transactions.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="6">
                        <div class="empty-state">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                <rect x="3" y="3" width="18" height="18" rx="2"></rect>
                                <line x1="9" y1="9" x2="15" y2="9"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            <p>No transactions found</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        // Sort by date (newest first)
        const sorted = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));

        tbody.innerHTML = sorted.map(t => `
            <tr>
                <td>${this.formatDate(t.date)}</td>
                <td>${this.escapeHtml(t.description || '—')}</td>
                <td>${this.escapeHtml(t.category)}</td>
                <td class="${t.type === 'income' ? 'transaction-income' : 'transaction-expense'}">
                    ${t.type === 'income' ? '+' : '−'}${this.formatCurrency(t.amount)}
                </td>
                <td>
                    <span class="type-badge type-${t.type}">
                        ${t.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                </td>
                <td>
                    <button class="delete-btn" data-id="${t.id}" title="Delete transaction">
                        🗑️
                    </button>
                </td>
            </tr>
        `).join('');
    }

    renderAnalytics() {
        this.renderTrendChart();
        this.renderComparisonChart();
        this.renderDistributionChart();
    }

    renderTrendChart() {
        // Monthly trend showing income vs expenses for past 6 months
        const chartContainer = document.getElementById('trendChart');
        const allTransactions = this.state.transactions;

        if (allTransactions.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <line x1="12" y1="2" x2="12" y2="22"></line>
                        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h.5M6.5 15H15a3.5 3.5 0 0 1 0 7h-.5"></path>
                    </svg>
                    <p>No trend data</p>
                </div>
            `;
            return;
        }

        // Get last 6 months
        const months = this.getLast6Months();
        const trendData = months.map(month => {
            const monthTransactions = this.state.getFilteredTransactions(month);
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + t.amount, 0);
            const expenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + t.amount, 0);

            return { month, income, expenses };
        }).filter(d => d.income > 0 || d.expenses > 0);

        if (trendData.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <p>No data for the last 6 months</p>
                </div>
            `;
            return;
        }

        const maxValue = Math.max(...trendData.map(d => Math.max(d.income, d.expenses)));

        chartContainer.innerHTML = `
            <div style="width: 100%; display: flex; align-items: flex-end; gap: 1rem; height: 200px;">
                ${trendData.map(data => `
                    <div style="flex: 1; display: flex; flex-direction: column; gap: 0.5rem;">
                        <div style="display: flex; gap: 4px; height: 120px; align-items: flex-end;">
                            <div style="flex: 1; background: linear-gradient(to top, var(--success), #34D399); border-radius: 4px 4px 0 0; height: ${(data.income / maxValue) * 100}%; position: relative;" title="Income: ${this.formatCurrency(data.income)}"></div>
                            <div style="flex: 1; background: linear-gradient(to top, var(--danger), #FCA5A5); border-radius: 4px 4px 0 0; height: ${(data.expenses / maxValue) * 100}%; position: relative;" title="Expenses: ${this.formatCurrency(data.expenses)}"></div>
                        </div>
                        <small style="text-align: center; color: var(--neutral-500);">${data.month}</small>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 1rem; display: flex; gap: 1.5rem; justify-content: center; font-size: 0.875rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: var(--success); border-radius: 2px;"></div>
                    <span>Income</span>
                </div>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 12px; height: 12px; background: var(--danger); border-radius: 2px;"></div>
                    <span>Expenses</span>
                </div>
            </div>
        `;
    }

    renderComparisonChart() {
        const totals = this.state.calculateTotals(this.state.currentMonth);
        const maxValue = Math.max(totals.income, totals.expenses) || 100;

        const incomeHeight = (totals.income / maxValue) * 100;
        const expenseHeight = (totals.expenses / maxValue) * 100;

        document.getElementById('incomeBar').style.width = incomeHeight + '%';
        document.getElementById('expenseBar').style.width = expenseHeight + '%';
        document.getElementById('incomeBarValue').textContent = this.formatCurrency(totals.income);
        document.getElementById('expenseBarValue').textContent = this.formatCurrency(totals.expenses);
    }

    renderDistributionChart() {
        const breakdown = this.state.getCategoryBreakdown(this.state.currentMonth);
        const chartContainer = document.getElementById('distributionChart');

        if (breakdown.length === 0) {
            chartContainer.innerHTML = `
                <div class="empty-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 6v6l4 2"></path>
                    </svg>
                    <p>No category data</p>
                </div>
            `;
            return;
        }

        const total = breakdown.reduce((sum, item) => sum + item.amount, 0);
        const colors = ['#5B5BFF', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

        let currentAngle = 0;
        const slices = breakdown.map((item, index) => {
            const slicePercent = item.amount / total;
            const sliceAngle = slicePercent * 360;
            const startAngle = currentAngle;
            currentAngle += sliceAngle;

            const color = colors[index % colors.length];

            return {
                ...item,
                startAngle,
                sliceAngle,
                color
            };
        });

        const svgSize = 250;
        const radius = 80;
        const centerX = svgSize / 2;
        const centerY = svgSize / 2;

        let paths = '';
        slices.forEach(slice => {
            const startRad = (slice.startAngle * Math.PI) / 180;
            const endRad = ((slice.startAngle + slice.sliceAngle) * Math.PI) / 180;

            const x1 = centerX + radius * Math.cos(startRad);
            const y1 = centerY + radius * Math.sin(startRad);
            const x2 = centerX + radius * Math.cos(endRad);
            const y2 = centerY + radius * Math.sin(endRad);

            const largeArc = slice.sliceAngle > 180 ? 1 : 0;

            paths += `<path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${slice.color}" opacity="0.8" stroke="white" stroke-width="2" />`;
        });

        const legend = slices.map(slice => `
            <div style="display: flex; align-items: center; gap: 0.5rem; font-size: 0.875rem;">
                <div style="width: 12px; height: 12px; background-color: ${slice.color}; border-radius: 2px;"></div>
                <span>${this.escapeHtml(slice.category)}: ${slice.percentage}%</span>
            </div>
        `).join('');

        chartContainer.innerHTML = `
            <div style="display: flex; gap: 2rem; align-items: center; justify-content: center; width: 100%; flex-wrap: wrap;">
                <svg width="${svgSize}" height="${svgSize}" viewBox="0 0 ${svgSize} ${svgSize}">
                    ${paths}
                </svg>
                <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    ${legend}
                </div>
            </div>
        `;
    }

    // ===== UTILITY METHODS =====

    formatCurrency(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }

    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getLast6Months() {
        const months = [];
        const today = new Date();

        for (let i = 5; i >= 0; i--) {
            const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const month = date.toISOString().substring(0, 7);
            months.push(month);
        }

        return months;
    }

    loadTheme() {
        const theme = this.state.getTheme();
        if (theme === 'dark') {
            document.body.classList.add('dark-mode');
        }
    }

    toggleTheme() {
        const isDark = document.body.classList.toggle('dark-mode');
        this.state.setTheme(isDark ? 'dark' : 'light');
    }

    // ===== TRANSACTION FILTER =====

    updateTransactionFilter(category) {
        this.renderTransactionsTable();
    }

    updateMonthFilter(month) {
        if (month) {
            this.state.setCurrentMonth(month);
        } else {
            this.state.setCurrentMonth(this.state.getCurrentMonth());
        }
        this.renderDashboard();
    }
}

/**
 * Event Handler
 * Manages all user interactions
 */
class EventHandler {
    constructor(ui, state) {
        this.ui = ui;
        this.state = state;
        this.currentDeleteId = null;
    }

    // ===== INITIALIZATION =====

    attachEventListeners() {
        // Form submission
        document.getElementById('addTransactionForm').addEventListener('submit', e => this.handleFormSubmit(e));

        // Form tab switching
        document.querySelectorAll('.form-tab-btn').forEach(btn => {
            btn.addEventListener('click', e => this.handleFormTabSwitch(e));
        });

        // Sidebar navigation
        document.querySelectorAll('[data-tab]').forEach(btn => {
            btn.addEventListener('click', e => this.handleTabSwitch(e));
        });

        // Mobile menu
        document.getElementById('mobileMenuToggle').addEventListener('click', () => this.toggleMobileSidebar());
        document.getElementById('closeSidebar').addEventListener('click', () => this.toggleMobileSidebar());

        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.handleThemeToggle());

        // Clear data
        document.getElementById('clearDataBtn').addEventListener('click', () => this.handleClearData());

        // Export
        document.getElementById('exportBtn').addEventListener('click', () => this.handleExport());

        // Delete buttons (delegated)
        document.getElementById('transactionsBody').addEventListener('click', e => {
            if (e.target.classList.contains('delete-btn')) {
                this.handleDeleteTransaction(e.target.dataset.id);
            }
        });

        // Month filter
        document.getElementById('monthFilter').addEventListener('change', e => {
            this.ui.updateMonthFilter(e.target.value);
        });

        // Transaction filter
        document.getElementById('transactionFilter').addEventListener('change', e => {
            this.ui.updateTransactionFilter(e.target.value);
        });

        // Modal actions
        document.getElementById('modalCancel').addEventListener('click', () => this.closeModal());
        document.getElementById('modalConfirm').addEventListener('click', () => this.confirmAction());

        // Input validation
        document.getElementById('amount').addEventListener('input', e => this.validateAmount(e));
    }

    // ===== FORM HANDLING =====

    handleFormSubmit(e) {
        e.preventDefault();

        // Clear previous error messages
        this.clearErrors();

        // Get form values
        const amount = document.getElementById('amount').value;
        const category = document.getElementById('category').value;
        const date = document.getElementById('date').value;
        const description = document.getElementById('description').value;

        // Validate
        const isValid = this.validateForm(amount, category, date);
        if (!isValid) return;

        // Determine transaction type from active tab
        const activeTab = document.querySelector('.form-tab-btn.active');
        const type = activeTab.dataset.type;

        // Create transaction
        const transaction = {
            type,
            amount,
            category,
            date,
            description
        };

        this.state.addTransaction(transaction);

        // Show success toast
        this.showToast(`${type === 'income' ? 'Income' : 'Expense'} added successfully!`, 'success');

        // Reset form
        document.getElementById('addTransactionForm').reset();
        this.ui.setTodayAsDefaultDate();

        // Refresh UI
        this.ui.renderDashboard();

        // Populate month filter if empty
        if (!document.getElementById('monthFilter').value) {
            document.getElementById('monthFilter').value = this.state.currentMonth;
        }
    }

    validateForm(amount, category, date) {
        let isValid = true;

        // Validate amount
        if (!amount || parseFloat(amount) <= 0 || isNaN(amount)) {
            this.showError('amount', 'Please enter a valid amount');
            isValid = false;
        }

        // Validate category
        if (!category) {
            this.showError('category', 'Please select a category');
            isValid = false;
        }

        // Validate date
        if (!date) {
            this.showError('date', 'Please select a date');
            isValid = false;
        }

        return isValid;
    }

    showError(fieldId, message) {
        const errorEl = document.getElementById(`${fieldId}Error`);
        errorEl.textContent = message;
        errorEl.classList.add('show');
    }

    clearErrors() {
        document.querySelectorAll('.error-msg').forEach(el => {
            el.textContent = '';
            el.classList.remove('show');
        });
    }

    validateAmount(e) {
        const value = e.target.value;
        if (value < 0) {
            e.target.value = Math.abs(value);
        }
    }

    handleFormTabSwitch(e) {
        const type = e.target.dataset.type;

        // Update active tab
        document.querySelectorAll('.form-tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        e.target.classList.add('active');

        // Update category options
        this.ui.updateCategoryOptions(type);

        // Clear previous values
        this.clearErrors();
        document.getElementById('category').value = '';
    }

    // ===== NAVIGATION =====

    handleTabSwitch(e) {
        const tabName = e.target.closest('[data-tab]').dataset.tab;

        // Update active nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        e.target.closest('[data-tab]').classList.add('active');

        // Show active tab
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.style.display = 'none';
        });
        document.getElementById(tabName).style.display = 'block';

        // Close mobile sidebar
        this.toggleMobileSidebar(false);

        // Refresh analytics on tab switch
        if (tabName === 'analytics') {
            this.ui.renderAnalytics();
        }
    }

    toggleMobileSidebar(forceClose = null) {
        const sidebar = document.getElementById('sidebar');
        const isOpen = sidebar.classList.contains('show');

        if (forceClose === false || (forceClose === null && isOpen)) {
            sidebar.classList.remove('show');
        } else if (forceClose === true || (forceClose === null && !isOpen)) {
            sidebar.classList.add('show');
        }
    }

    // ===== DATA OPERATIONS =====

    handleThemeToggle() {
        this.ui.toggleTheme();
    }

    handleClearData() {
        this.showConfirmation(
            'Clear All Data',
            'Are you sure you want to delete all transactions? This cannot be undone.',
            () => {
                this.state.clearAllData();
                this.ui.renderDashboard();
                this.showToast('All data cleared', 'success');
            }
        );
    }

    handleExport() {
        const json = this.state.exportToJSON();
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fintrack-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Exported to JSON', 'success');
    }

    handleDeleteTransaction(id) {
        this.currentDeleteId = id;
        const transaction = this.state.transactions.find(t => t.id === id);
        if (transaction) {
            this.showConfirmation(
                'Delete Transaction',
                `Delete ${transaction.type === 'income' ? 'income' : 'expense'} of ${this.ui.formatCurrency(transaction.amount)}?`,
                () => {
                    this.state.deleteTransaction(this.currentDeleteId);
                    this.ui.renderDashboard();
                    this.showToast('Transaction deleted', 'success');
                }
            );
        }
    }

    // ===== NOTIFICATIONS =====

    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast show ${type}`;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    showConfirmation(title, message, onConfirm) {
        const modal = document.getElementById('confirmationModal');
        document.getElementById('modalTitle').textContent = title;
        document.getElementById('modalMessage').textContent = message;

        this.onConfirmCallback = onConfirm;

        modal.classList.add('show');
    }

    closeModal() {
        const modal = document.getElementById('confirmationModal');
        modal.classList.remove('show');
    }

    confirmAction() {
        if (this.onConfirmCallback) {
            this.onConfirmCallback();
        }
        this.closeModal();
    }
}

/**
 * Application Main Class
 * Initializes and manages the application lifecycle
 */
class Application {
    constructor() {
        this.state = new StateManager();
        this.ui = new UIRenderer(this.state);
        this.events = new EventHandler(this.ui, this.state);
    }

    initialize() {
        this.ui.initializeUI();
        this.events.attachEventListeners();

        // Set initial month in filter
        document.getElementById('monthFilter').value = this.state.currentMonth;

        // Populate category filter
        this.populateCategoryFilter();

        console.log('FinTrack Application Initialized');
    }

    populateCategoryFilter() {
        const select = document.getElementById('transactionFilter');
        const categories = new Set();

        this.state.transactions.forEach(t => {
            categories.add(t.category);
        });

        // Clear existing options except the first one
        while (select.options.length > 1) {
            select.remove(1);
        }

        // Add categories
        Array.from(categories).sort().forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        });
    }
}

/**
 * Initialize Application on DOM Ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const app = new Application();
    app.initialize();
});
