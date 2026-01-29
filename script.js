class GebizGenerator {
    constructor() {
        this.form = document.getElementById('documentForm');
        this.generateBtn = document.getElementById('generateBtn');
        this.btnText = document.getElementById('btnText');
        this.spinner = document.getElementById('loadingSpinner');
        this.outputContainer = document.getElementById('outputContainer');
        this.documentOutput = document.getElementById('documentOutput');
        this.placeholder = document.getElementById('placeholderContent');
        this.errorContainer = document.getElementById('errorContainer');
        this.errorText = document.getElementById('errorText');
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleGenerate(e));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyDocument());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadDocument());
        document.getElementById('retryBtn').addEventListener('click', () => this.hideError());
    }

    async handleGenerate(e) {
        e.preventDefault();
        
        const data = this.getFormData();
        if (!this.isValid(data)) return;

        this.showLoading();
        this.hideAll();

        try {
            const document = await this.generateDocument(data);
            this.showDocument(document);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    getFormData() {
        return {
            type: document.getElementById('documentType').value,
            category: document.getElementById('procurementCategory').value,
            budget: document.getElementById('budgetRange').value,
            timeline: document.getElementById('timeline').value,
            requirements: document.getElementById('specificRequirements').value
        };
    }

    isValid(data) {
        if (!data.type || !data.category || !data.budget || !data.timeline) {
            this.showError('Please fill in all required fields');
            return false;
        }
        return true;
    }

    async generateDocument(data) {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const typeNames = {
            'functional-requirements': 'FUNCTIONAL REQUIREMENTS',
            'evaluation-criteria': 'EVALUATION CRITERIA'
        };

        const categoryNames = {
            'it-services': 'IT Services',
            'goods': 'Goods & Supplies'
        };

        return `${typeNames[data.type]}

Category: ${categoryNames[data.category]}
Budget: ${data.budget.replace('-', ' - ').replace('k', 'K').replace('m', 'M')}
Timeline: ${data.timeline.replace('-', ' - ')}

OVERVIEW
This document specifies the ${typeNames[data.type].toLowerCase()} for ${categoryNames[data.category].toLowerCase()}.

REQUIREMENTS
${data.requirements || 'Standard procurement requirements as per GEBIZ guidelines.'}

COMPLIANCE
• Valid GEBIZ registration required
• Singapore business registration
• Relevant certifications and licenses
• Appropriate insurance coverage

EVALUATION CRITERIA
• Technical capability: 40%
• Cost effectiveness: 30%
• Track record: 20%
• Timeline: 10%

---
Generated: ${new Date().toLocaleString()}
GEBIZ X POC - Demo by Jeff`;
    }

    showLoading() {
        this.generateBtn.disabled = true;
        this.btnText.textContent = 'Generating...';
        this.spinner.classList.remove('hidden');
    }

    hideLoading() {
        this.generateBtn.disabled = false;
        this.btnText.textContent = 'Generate';
        this.spinner.classList.add('hidden');
    }

    showDocument(content) {
        this.documentOutput.textContent = content;
        this.outputContainer.classList.remove('hidden');
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorContainer.classList.remove('hidden');
    }

    hideAll() {
        this.outputContainer.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
        this.placeholder.classList.add('hidden');
    }

    hideError() {
        this.errorContainer.classList.add('hidden');
        this.placeholder.classList.remove('hidden');
    }

    async copyDocument() {
        try {
            await navigator.clipboard.writeText(this.documentOutput.textContent);
            const btn = document.getElementById('copyBtn');
            const original = btn.textContent;
            btn.textContent = 'Copied!';
            setTimeout(() => btn.textContent = original, 1500);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }

    downloadDocument() {
        const content = this.documentOutput.textContent;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'gebiz-document.txt';
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GebizGenerator();
});
