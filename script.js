class GebizGenerator {
    constructor() {
        this.form = document.getElementById('documentForm');
        this.generateBtn = document.getElementById('generateBtn');
        this.btnText = document.getElementById('btnText');
        this.spinner = document.getElementById('loadingSpinner');
        this.outputContainer = document.getElementById('outputContainer');
        this.documentOutput = document.getElementById('documentOutput');
        this.placeholder = document.getElementById('placeholderContent');
        this.loadingState = document.getElementById('loadingState');
        this.errorContainer = document.getElementById('errorContainer');
        this.errorText = document.getElementById('errorText');
        this.sidebar = document.getElementById('sidebar');
        this.sidebarToggle = document.getElementById('sidebarToggle');
        this.mainContent = document.querySelector('.main-content');
        this.projectsList = document.getElementById('projectsList');
        this.sidebarCollapsed = false;
        
        this.init();
    }

    init() {
        this.form.addEventListener('submit', (e) => this.handleGenerate(e));
        document.getElementById('copyBtn').addEventListener('click', () => this.copyDocument());
        document.getElementById('downloadBtn').addEventListener('click', () => this.downloadDocument());
        document.getElementById('retryBtn').addEventListener('click', () => this.hideError());
        this.sidebarToggle.addEventListener('click', () => this.toggleSidebar());
        this.sidebarToggle.addEventListener('mouseenter', () => this.updateTooltip());

        // New Specification button click
        const newSpecBtn = document.querySelector('[data-section="new-spec"]');
        newSpecBtn.addEventListener('click', (e) => this.handleNewSpecification(e));

        // Clear errors on change
        document.getElementById('agency').addEventListener('change', (e) => {
            if (e.target.value) this.clearFieldError(e.target, document.getElementById('agency-error'));
        });
        document.getElementById('budgetRange').addEventListener('change', (e) => {
            if (e.target.value) this.clearFieldError(e.target, document.getElementById('budget-error'));
        });
        
        // Close sidebar on mobile when clicking a nav item
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth < 768) {
                    this.closeSidebar();
                }
            });
        });

        // Render recent projects
        this.renderProjects();
    }

    handleNewSpecification(e) {
        e.preventDefault();
        this.form.reset();
        this.outputContainer.classList.add('hidden');
        this.placeholder.classList.remove('hidden');
        this.loadingState.classList.add('hidden');
        this.errorContainer.classList.add('hidden');
    }

    renderProjects() {
        // Get projects from localStorage
        const projectsData = localStorage.getItem('gebizProjects');
        const projects = projectsData ? JSON.parse(projectsData) : [];
        
        // Clear the list
        this.projectsList.innerHTML = '';
        
        if (projects.length === 0) {
            this.projectsList.innerHTML = '<p class="no-projects">No recent projects yet</p>';
            return;
        }
        
        // Map through projects and create cards
        projects.forEach((project, index) => {
            const projectCard = document.createElement('div');
            projectCard.className = 'project-card';
            
            projectCard.innerHTML = `
                <div class="project-card-content">
                    <div class="project-title">${project.title || 'Untitled Project'}</div>
                    <div class="project-meta">
                        <span class="project-agency">${project.agency.toUpperCase() || 'N/A'}</span>
                        <span class="project-date">${project.timestamp || ''}</span>
                    </div>
                </div>
                <button class="project-delete-btn" title="Delete project" data-index="${index}">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
                    </svg>
                </button>
            `;
            
            projectCard.addEventListener('click', (e) => {
                if (!e.target.closest('.project-delete-btn')) {
                    this.loadProject(project);
                }
            });

            const deleteBtn = projectCard.querySelector('.project-delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteProject(index);
            });
            
            this.projectsList.appendChild(projectCard);
        });
    }

    deleteProject(index) {
        let projects = JSON.parse(localStorage.getItem('gebizProjects')) || [];
        projects.splice(index, 1);
        localStorage.setItem('gebizProjects', JSON.stringify(projects));
        this.renderProjects();
    }

    loadProject(project) {
        if (project) {
            // Populate form with project data
            document.getElementById('agency').value = project.agency || '';
            document.getElementById('budgetRange').value = project.budget || '';
            document.getElementById('specificRequirements').value = project.userRequirements || '';
            
            // Show the document
            if (project.document) {
                this.documentOutput.textContent = project.document;
                this.outputContainer.classList.remove('hidden');
                this.placeholder.classList.add('hidden');
            }
        }
    }

    updateTooltip() {
        const tooltip = this.sidebarCollapsed ? 'Open sidebar' : 'Close sidebar';
        this.sidebarToggle.setAttribute('data-tooltip', tooltip);
    }

    toggleSidebar() {
        if (window.innerWidth < 768) {
            this.sidebar.classList.toggle('open');
            this.mainContent.classList.toggle('sidebar-open');
        } else {
            this.sidebar.classList.toggle('collapsed');
            this.mainContent.classList.toggle('sidebar-collapsed');
            this.sidebarCollapsed = !this.sidebarCollapsed;
            this.updateTooltip();
        }
    }

    closeSidebar() {
        if (window.innerWidth < 768) {
            this.sidebar.classList.remove('open');
            this.mainContent.classList.remove('sidebar-open');
        }
    }

    async handleGenerate(e) {
        e.preventDefault();
        
        const data = this.getFormData();
        if (!this.isValid(data)) return;

        this.showLoading();
        this.hideAll();

        try {
            // Prepare structured data for backend
            const structuredData = this.buildStructuredRequest(data);
            console.log('Sending to backend:', JSON.stringify(structuredData, null, 2));
            
            // For now, simulate the generation locally
            const document = await this.generateDocument(structuredData);
            this.showDocument(document);
        } catch (error) {
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    getFormData() {
        return {
            agency: document.getElementById('agency').value,
            budget: document.getElementById('budgetRange').value,
            userRequirements: document.getElementById('specificRequirements').value
        };
    }

    buildStructuredRequest(formData) {
        return {
            agency: formData.agency,
            budget: formData.budget,
            userRequirements: formData.userRequirements,
            generationInstructions: {
                tone: "Formal Singapore Government Procurement",
                structure: [
                    "Overview",
                    "Scope of Work",
                    "Technical Requirements",
                    "Compliance Requirements",
                    "Evaluation Criteria",
                    "Deliverables",
                    "Timeline"
                ],
                formatting: "Clear headings, bullet points, structured sections"
            }
        };
    }

    isValid(data) {
        let valid = true;

        const agencyEl = document.getElementById('agency');
        const budgetEl = document.getElementById('budgetRange');
        const agencyErr = document.getElementById('agency-error');
        const budgetErr = document.getElementById('budget-error');

        // Reset
        [agencyEl, budgetEl].forEach(el => el.classList.remove('has-error'));
        [agencyErr, budgetErr].forEach(el => el.classList.add('hidden'));

        if (!data.agency) {
            agencyEl.classList.add('has-error');
            agencyErr.classList.remove('hidden');
            valid = false;
        }
        if (!data.budget) {
            budgetEl.classList.add('has-error');
            budgetErr.classList.remove('hidden');
            valid = false;
        }

        return valid;
    }

    clearFieldError(el, errEl) {
        el.classList.remove('has-error');
        errEl.classList.add('hidden');
    }

    async generateDocument(structuredData) {
        // Simulate API call to backend/Bedrock
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const agencyNames = {
            'moe': 'MOE',
            'htx': 'HTX',
            'vital': 'VITAL'
        };

        // This would normally come from the backend
        const document = `PROCUREMENT DOCUMENT

Agency: ${agencyNames[structuredData.agency]}
Budget: ${structuredData.budget}
Date: ${new Date().toLocaleDateString('en-SG')}

═══════════════════════════════════════════════════════════

OVERVIEW
This document specifies the procurement requirements for the selected agency as per formal Singapore government procurement standards.

SCOPE OF WORK
${structuredData.userRequirements || 'Standard procurement requirements as per GEBIZ guidelines.'}

TECHNICAL REQUIREMENTS
• System integration capability with existing infrastructure
• Compliance with Singapore government standards
• Security and data protection requirements
• Performance and scalability standards
• Support and maintenance provisions

COMPLIANCE REQUIREMENTS
• Valid GEBIZ registration required
• Singapore business registration
• Relevant certifications and licenses
• Appropriate insurance coverage
• PDPA compliance for data handling

EVALUATION CRITERIA
• Technical capability and innovation: 40%
• Cost effectiveness and value for money: 30%
• Track record and experience: 20%
• Implementation timeline and support: 10%

DELIVERABLES
• Solution design and architecture
• Implementation and deployment
• Documentation and training
• Support and maintenance services
• Performance monitoring and reporting

TIMELINE
• Submission deadline: 2 weeks from issuance
• Evaluation period: 2-4 weeks
• Approval and award: 1 week
• Implementation start: Upon contract signing

═══════════════════════════════════════════════════════════
Generated: ${new Date().toLocaleString('en-SG')}
GEBIZ X - Functional Specification Generator`;

        // Save to localStorage
        this.saveProject({
            title: `${agencyNames[structuredData.agency]} Specification`,
            agency: structuredData.agency,
            budget: structuredData.budget,
            userRequirements: structuredData.userRequirements,
            document: document,
            timestamp: new Date().toLocaleString('en-SG', { 
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            })
        });

        return document;
    }

    saveProject(projectData) {
        let projects = JSON.parse(localStorage.getItem('gebizProjects')) || [];
        
        const newProject = {
            id: Date.now(),
            title: projectData.title,
            agency: projectData.agency,
            budget: projectData.budget,
            userRequirements: projectData.userRequirements,
            document: projectData.document,
            timestamp: projectData.timestamp
        };

        projects.unshift(newProject); // Add to beginning
        projects = projects.slice(0, 5); // Keep only 5 most recent

        localStorage.setItem('gebizProjects', JSON.stringify(projects));
    }

    showLoading() {
        this.generateBtn.disabled = true;
        this.btnText.textContent = 'Generating...';
        this.spinner.classList.remove('hidden');
        this.loadingState.classList.remove('hidden');
    }

    hideLoading() {
        this.generateBtn.disabled = false;
        this.btnText.textContent = 'Generate';
        this.spinner.classList.add('hidden');
        this.loadingState.classList.add('hidden');
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
        this.loadingState.classList.add('hidden');
    }

    hideError() {
        this.errorContainer.classList.add('hidden');
        this.placeholder.classList.remove('hidden');
    }

    async copyDocument() {
        try {
            await navigator.clipboard.writeText(this.documentOutput.textContent);
            const btn = document.getElementById('copyBtn');
            const original = btn.innerHTML;
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>Copied!';
            setTimeout(() => btn.innerHTML = original, 2000);
        } catch (err) {
            console.error('Copy failed:', err);
        }
    }

    downloadDocument() {
        const content = this.documentOutput.textContent;
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `gebiz-procurement-${new Date().getTime()}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new GebizGenerator();
});
