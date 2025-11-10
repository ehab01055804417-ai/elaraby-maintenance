import { db } from './db.js';

// التطبيق الرئيسي
class MaintenanceApp {
    constructor() {
        this.currentEditingId = null;
        this.isSidebarOpen = false;
        this.currentPartsReport = null;
        this.currentDeletingExpenseId = null;
        this.currentDeletingPartsId = null;
        this.currentDeletingTechnicianId = null;
        this.currentFilteredReports = [];
        this.currentFilteredParts = [];
        this.currentFilteredDeleted = [];
        this.currentFilteredTechnicians = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateDateTime();
        this.loadReports();
        this.setupNavigation();
        this.updateStats();
        this.setupAudioPlayer();
        this.loadPartsPermissions();
        this.loadExpenses();
        this.updateStatistics();
        this.populateTechniciansDropdowns();
        
        // تشغيل الصوت تلقائياً عند فتح الموقع
        setTimeout(() => {
            this.toggleAudio(true);
        }, 1000);
        
        // تحديث التاريخ كل ثانية
        this.dateTimeInterval = setInterval(() => this.updateDateTime(), 1000);
        
        // تحديث الإحصائيات كل 5 ثواني
        this.statsInterval = setInterval(() => this.updateStats(), 5000);
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // أزرار التنقل
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                if (section) {
                    this.showSection(section);
                }
                this.toggleSidebar(false);
            });
        });

        // زر toggle القائمة الجانبية
        document.getElementById('toggleSidebar').addEventListener('click', () => {
            this.toggleSidebar();
        });

        // زر إغلاق القائمة الجانبية
        document.getElementById('closeSidebar').addEventListener('click', () => {
            this.toggleSidebar(false);
        });

        // البحث والتصفية للبلاغات
        document.getElementById('searchInput').addEventListener('input', () => this.loadReports());
        document.getElementById('filterStatus').addEventListener('change', () => this.loadReports());
        document.getElementById('filterDate').addEventListener('change', () => this.loadReports());
        document.getElementById('filterMonth').addEventListener('change', () => this.loadReports());
        document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());

        // البحث والتصفية لأذونات قطع الغيار
        document.getElementById('partsSearchInput').addEventListener('input', () => this.loadPartsPermissions());
        document.getElementById('filterPartsCustomer').addEventListener('input', () => this.loadPartsPermissions());
        document.getElementById('filterPartsMonth').addEventListener('change', () => this.loadPartsPermissions());
        document.getElementById('filterPartsDate').addEventListener('change', () => this.loadPartsPermissions());
        document.getElementById('clearPartsFilters').addEventListener('click', () => this.clearPartsFilters());

        // البحث والتصفية للفنيين
        document.getElementById('technicianSearchInput').addEventListener('input', () => this.loadTechnicians());
        document.getElementById('filterTechnicianMonth').addEventListener('change', () => this.loadTechnicians());
        document.getElementById('filterTechnicianDate').addEventListener('change', () => this.loadTechnicians());
        document.getElementById('clearTechnicianFilters').addEventListener('click', () => this.clearTechnicianFilters());

        // أزرار التصدير
        document.getElementById('exportTableExcel').addEventListener('click', () => excelExporter.exportFilteredReports());
        document.getElementById('exportPartsExcel').addEventListener('click', () => excelExporter.exportFilteredParts());
        document.getElementById('exportDeletedExcel').addEventListener('click', () => excelExporter.exportFilteredDeletedReports());

        // نموذج إضافة البلاغ
        document.getElementById('saveReportBtn').addEventListener('click', () => this.saveReport());
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());

        // أحداث الشاشة المنبثقة للتعديل
        document.getElementById('closeEditModal').addEventListener('click', () => this.closeEditModal());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeEditModal());
        document.getElementById('saveEditBtn').addEventListener('click', () => this.saveEdit());

        // إغلاق الشاشة المنبثقة بالنقر خارجها
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });

        // حساب إجمالي الرسوم
        document.addEventListener('input', (e) => {
            if (e.target.id === 'visitFee' || e.target.id === 'repairFee') {
                this.calculateTotalFees();
            }
            if (e.target.id === 'editVisitFee' || e.target.id === 'editRepairFee') {
                this.calculateEditTotalFees();
            }
        });

        // إغلاق القائمة بالنقر خارجها
        document.addEventListener('click', (e) => {
            const sidebar = document.getElementById('sidebar');
            const toggleBtn = document.getElementById('toggleSidebar');
            
            if (this.isSidebarOpen && 
                !sidebar.contains(e.target) && 
                !toggleBtn.contains(e.target)) {
                this.toggleSidebar(false);
            }
        });

        // إضافة مستمعي الأحداث للأزرار ديناميكياً
        this.setupDynamicEventListeners();

        // أحداث الميزات الجديدة
        this.setupNewFeaturesEventListeners();
    }

    // إعداد مستمعي الأحداث للميزات الجديدة
    setupNewFeaturesEventListeners() {
        // مشغل الصوت
        document.getElementById('toggleAudio').addEventListener('click', () => this.toggleAudio());
        document.getElementById('volumeSlider').addEventListener('input', (e) => {
            this.audio.volume = e.target.value;
        });

        // المصروفات
        document.getElementById('saveExpenseBtn').addEventListener('click', () => this.saveExpense());
        document.getElementById('resetExpenseForm').addEventListener('click', () => this.resetExpenseForm());

        // الفنيين
        document.getElementById('saveTechnicianBtn').addEventListener('click', () => this.saveTechnician());
        document.getElementById('resetTechnicianForm').addEventListener('click', () => this.resetTechnicianForm());

        // الإحصائيات
        document.getElementById('statsMonthFilter').addEventListener('change', () => this.updateStatistics());

        // حذف المصروفات
        document.getElementById('closeDeleteExpenseModal').addEventListener('click', () => this.closeDeleteExpenseModal());
        document.getElementById('cancelDeleteExpense').addEventListener('click', () => this.closeDeleteExpenseModal());
        document.getElementById('confirmDeleteExpense').addEventListener('click', () => this.confirmDeleteExpense());

        // حذف أذونات قطع الغيار
        document.getElementById('closeDeletePartsModal').addEventListener('click', () => this.closeDeletePartsModal());
        document.getElementById('cancelDeleteParts').addEventListener('click', () => this.closeDeletePartsModal());
        document.getElementById('confirmDeleteParts').addEventListener('click', () => this.confirmDeleteParts());

        // حذف الفنيين
        document.getElementById('closeDeleteTechnicianModal').addEventListener('click', () => this.closeDeleteTechnicianModal());
        document.getElementById('cancelDeleteTechnician').addEventListener('click', () => this.closeDeleteTechnicianModal());
        document.getElementById('confirmDeleteTechnician').addEventListener('click', () => this.confirmDeleteTechnician());

        // التواصل مع الدعم
        document.getElementById('supportBtn').addEventListener('click', () => this.openSupportModal());
        document.getElementById('closeSupportModal').addEventListener('click', () => this.closeSupportModal());
        document.getElementById('closeSupportBtn').addEventListener('click', () => this.closeSupportModal());
        document.getElementById('supportModal').addEventListener('click', (e) => {
            if (e.target.id === 'supportModal') {
                this.closeSupportModal();
            }
        });
    }

    // مشغل الصوت - معدل
    setupAudioPlayer() {
        this.audio = document.getElementById('backgroundAudio');
        this.isAudioPlaying = false;
        this.audio.volume = 0.5; // مستوى صوت افتراضي
        
        // محاولة تشغيل الصوت تلقائياً
        this.audio.play().catch(e => {
            console.log('سيتم تشغيل الصوت بعد تفاعل المستخدم');
        });
    }

    toggleAudio(autoPlay = false) {
        const toggleBtn = document.getElementById('toggleAudio');
        
        if (this.isAudioPlaying && !autoPlay) {
            this.audio.pause();
            toggleBtn.innerHTML = '<i class="fas fa-volume-mute"></i>';
            this.isAudioPlaying = false;
        } else {
            this.audio.play().catch(e => {
                console.log('خطأ في تشغيل الصوت:', e);
                if (!autoPlay) {
                    this.showToast('تعذر تشغيل الملف الصوتي', 'error');
                }
            });
            toggleBtn.innerHTML = '<i class="fas fa-volume-up"></i>';
            this.isAudioPlaying = true;
        }
    }

    // فتح شاشة التواصل مع الدعم
    openSupportModal() {
        document.getElementById('supportModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // إغلاق شاشة التواصل مع الدعم
    closeSupportModal() {
        document.getElementById('supportModal').classList.remove('active');
        document.body.style.overflow = '';
    }

    // إعداد مستمعي الأحداث الديناميكية للجدول
    setupDynamicEventListeners() {
        // استخدام event delegation للتعامل مع الأزرار الديناميكية
        document.addEventListener('click', (e) => {
            const target = e.target;
            
            // التعامل مع أزرار التعديل
            if (target.closest('.btn-edit')) {
                const btn = target.closest('.btn-edit');
                const reportId = btn.dataset.id;
                if (reportId) {
                    this.editReport(reportId);
                }
            }
            
            // التعامل مع أزرار الحذف
            if (target.closest('.btn-delete')) {
                const btn = target.closest('.btn-delete');
                const reportId = btn.dataset.id;
                if (reportId) {
                    this.deleteReport(reportId);
                }
            }
            
            // التعامل مع أزرار الاستعادة
            if (target.closest('.btn-restore')) {
                const btn = target.closest('.btn-restore');
                const reportId = btn.dataset.id;
                if (reportId) {
                    this.restoreReport(reportId);
                }
            }

            // التعامل مع أزرار حذف المصروفات
            if (target.closest('.btn-delete-expense')) {
                const btn = target.closest('.btn-delete-expense');
                const expenseId = btn.dataset.id;
                if (expenseId) {
                    this.openDeleteExpenseModal(expenseId);
                }
            }

            // التعامل مع أزرار حذف أذونات قطع الغيار
            if (target.closest('.btn-delete-parts')) {
                const btn = target.closest('.btn-delete-parts');
                const partsId = btn.dataset.id;
                if (partsId) {
                    this.openDeletePartsModal(partsId);
                }
            }

            // التعامل مع أزرار حذف الفنيين
            if (target.closest('.btn-delete-technician')) {
                const btn = target.closest('.btn-delete-technician');
                const technicianId = btn.dataset.id;
                if (technicianId) {
                    this.openDeleteTechnicianModal(technicianId);
                }
            }

            // التعامل مع أزرار تعديل أذونات قطع الغيار
            if (target.closest('.btn-edit-parts')) {
                const btn = target.closest('.btn-edit-parts');
                const partsId = btn.dataset.id;
                if (partsId) {
                    this.editPartsPermission(partsId);
                }
            }
        });
    }

    // تبديل القائمة الجانبية
    toggleSidebar(forceState) {
        const sidebar = document.getElementById('sidebar');
        const contentArea = document.getElementById('contentArea');
        
        if (forceState !== undefined) {
            this.isSidebarOpen = forceState;
        } else {
            this.isSidebarOpen = !this.isSidebarOpen;
        }
        
        if (this.isSidebarOpen) {
            sidebar.classList.remove('collapsed');
            contentArea.classList.remove('expanded');
        } else {
            sidebar.classList.add('collapsed');
            contentArea.classList.add('expanded');
        }
    }

    // تحديث التاريخ والوقت
    updateDateTime() {
        const now = new Date();
        
        // تحديث الوقت
        const timeOptions = { 
            hour: '2-digit', 
            minute: '2-digit', 
            second: '2-digit',
            hour12: false 
        };
        
        const timeString = now.toLocaleTimeString('ar-EG', timeOptions);
        document.getElementById('currentTime').textContent = timeString;
        
        // تحديث التاريخ
        const dateOptions = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric'
        };
        
        const dateString = now.toLocaleDateString('ar-EG', dateOptions);
        document.getElementById('currentDate').textContent = dateString;
    }

    // تحديث الإحصائيات
    updateStats() {
        const activeReports = db.getAllReports();
        const deletedReports = db.getDeletedReports();
        
        document.getElementById('activeReportsCount').textContent = activeReports.length;
        document.getElementById('deletedReportsCount').textContent = deletedReports.length;
    }

    // إعداد التنقل
    setupNavigation() {
        // إضافة مستمعي الأحداث لأزرار التنقل
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.showSection(section);
            });
        });
    }

    // عرض قسم معين
    showSection(sectionId) {
        // إخفاء جميع الأقسام
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.remove('active');
        });

        // إزالة النشاط من جميع أزرار التنقل
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // إظهار القسم المطلوب
        document.getElementById(sectionId).classList.add('active');
        
        // تفعيل زر التنقل المقابل
        const correspondingBtn = document.querySelector(`[data-section="${sectionId}"]`);
        if (correspondingBtn) {
            correspondingBtn.classList.add('active');
        }

        // تحميل البيانات الخاصة بكل قسم
        if (sectionId === 'reports-table') {
            this.loadReports();
        } else if (sectionId === 'deleted-reports') {
            this.loadDeletedReports();
        } else if (sectionId === 'parts-permissions') {
            this.loadPartsPermissions();
        } else if (sectionId === 'statistics') {
            this.updateStatistics();
        } else if (sectionId === 'expenses') {
            this.loadExpenses();
        } else if (sectionId === 'technicians') {
            this.loadTechnicians();
        }
        
        this.updateStats();
    }

    // حساب إجمالي الرسوم
    calculateTotalFees() {
        const visitFee = parseFloat(document.getElementById('visitFee').value) || 0;
        const repairFee = parseFloat(document.getElementById('repairFee').value) || 0;
        document.getElementById('totalFees').value = visitFee + repairFee;
    }

    // حساب إجمالي الرسوم في الشاشة المنبثقة
    calculateEditTotalFees() {
        const visitFee = parseFloat(document.getElementById('editVisitFee').value) || 0;
        const repairFee = parseFloat(document.getElementById('editRepairFee').value) || 0;
        document.getElementById('editTotalFees').value = visitFee + repairFee;
    }

    // حفظ البلاغ - معدل ومصحح
    async saveReport() {
        const formData = {
            caseNumber: document.getElementById('caseNumber').value,
            dateTime: document.getElementById('dateTime').value,
            customerName: document.getElementById('customerName').value,
            customerAddress: document.getElementById('customerAddress').value,
            productType: document.getElementById('productType').value,
            model: document.getElementById('model').value,
            warranty: document.querySelector('input[name="warranty"]:checked')?.value || '',
            problemDescription: document.getElementById('problemDescription').value,
            visitFee: document.getElementById('visitFee').value,
            spareParts: document.getElementById('spareParts').value,
            partsIssued: document.querySelector('input[name="partsIssued"]:checked')?.value || '',
            inspectionTech: document.getElementById('inspectionTech').value,
            repairTech: document.getElementById('repairTech').value,
            repairFee: document.getElementById('repairFee').value,
            note1: document.getElementById('note1').value,
            note2: document.getElementById('note2').value,
            techFollowup: document.getElementById('techFollowup').value,
            totalFees: document.getElementById('totalFees').value,
            repairDate: document.getElementById('repairDate').value,
            status: document.getElementById('status').value
        };

        // التحقق من الحقول الإلزامية
        if (!formData.caseNumber || !formData.dateTime || !formData.customerName || !formData.customerAddress) {
            this.showToast('يرجى ملء الحقول الإلزامية', 'error');
            
            // إضافة أنيميشن للحقول المطلوبة
            ['caseNumber', 'dateTime', 'customerName', 'customerAddress'].forEach(field => {
                if (!formData[field]) {
                    const element = document.getElementById(field);
                    element.classList.add('error');
                    setTimeout(() => element.classList.remove('error'), 1000);
                }
            });
            
            return;
        }

        // إضافة تأثير تحميل للزر
        const saveBtn = document.getElementById('saveReportBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        saveBtn.disabled = true;

        // محاكاة التأخير للحصول على تجربة أفضل
        await new Promise(resolve => setTimeout(resolve, 1000));

        let savedReport;
        if (this.currentEditingId) {
            savedReport = await db.updateReport(this.currentEditingId, formData);
            this.showToast('تم تحديث البلاغ بنجاح');
        } else {
            savedReport = await db.addReport(formData);
            this.showToast('تم إضافة البلاغ بنجاح');
            
            // إعادة تعيين النموذج بعد الحفظ
            this.resetForm();
        }

        // استعادة حالة الزر
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;

        // تحديث الجداول والإحصائيات
        this.loadReports();
        this.updateStats();
        this.updateStatistics();
        
        // إظهار رسالة نجاح تفاعلية
        this.showSuccessAnimation();
    }

    // إعادة تعيين النموذج - معدل
    resetForm() {
        document.getElementById('reportForm').reset();
        this.calculateTotalFees();
        this.currentEditingId = null;
        
        // تحديث نص زر الحفظ
        document.getElementById('saveReportBtn').innerHTML = '<i class="fas fa-save"></i> حفظ البلاغ';
        
        this.showToast('تم إعادة تعيين النموذج');
    }

    // تحميل البلاغات مع الفلترة
    async loadReports() {
        const searchQuery = document.getElementById('searchInput').value;
        const filterStatus = document.getElementById('filterStatus').value;
        const filterDate = document.getElementById('filterDate').value;
        const filterMonth = document.getElementById('filterMonth').value;

        const filters = {};
        if (filterStatus) filters.status = filterStatus;
        if (filterDate) filters.date = filterDate;
        if (filterMonth) filters.month = filterMonth;

        const reports = await db.searchReports(searchQuery, filters);
        this.currentFilteredReports = reports;
        this.renderReportsTable(reports);
    }

    // عرض البلاغات في الجدول
    renderReportsTable(reports) {
        const tbody = document.getElementById('reportsTableBody');
        
        if (reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="21" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-inbox" style="font-size: 4rem; color: #6c757d; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>
                        <h4 style="color: #6c757d; margin-bottom: 0.5rem;">لا توجد بلاغات</h4>
                        <p style="color: #8a93a2; font-size: 0.9rem;">لم يتم إضافة أي بلاغات بعد</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = reports.map((report, index) => `
            <tr class="table-row ${report.status || ''}">
                <td><strong>${report.caseNumber || ''}</strong></td>
                <td>${report.dateTime ? new Date(report.dateTime).toLocaleString('ar-EG') : ''}</td>
                <td>${report.customerName || ''}</td>
                <td>${report.customerAddress || ''}</td>
                <td>${report.productType || ''}</td>
                <td>${report.model || ''}</td>
                <td>${report.warranty || ''}</td>
                <td title="${report.problemDescription || ''}">
                    ${report.problemDescription ? (report.problemDescription.length > 50 ? 
                      report.problemDescription.substring(0, 50) + '...' : report.problemDescription) : ''}
                </td>
                <td>${report.visitFee || '0'}</td>
                <td>${report.spareParts || ''}</td>
                <td>${report.partsIssued || ''}</td>
                <td>${report.inspectionTech || ''}</td>
                <td>${report.repairTech || ''}</td>
                <td>${report.repairFee || '0'}</td>
                <td title="${report.note1 || ''}">
                    ${report.note1 ? (report.note1.length > 30 ? 
                      report.note1.substring(0, 30) + '...' : report.note1) : ''}
                </td>
                <td title="${report.note2 || ''}">
                    ${report.note2 ? (report.note2.length > 30 ? 
                      report.note2.substring(0, 30) + '...' : report.note2) : ''}
                </td>
                <td title="${report.techFollowup || ''}">
                    ${report.techFollowup ? (report.techFollowup.length > 30 ? 
                      report.techFollowup.substring(0, 30) + '...' : report.techFollowup) : ''}
                </td>
                <td><strong>${report.totalFees || '0'}</strong></td>
                <td>${report.repairDate || ''}</td>
                <td>
                    <span class="status-badge ${report.status || ''}">
                        ${this.getStatusText(report.status)}
                    </span>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-warning btn-sm btn-edit" data-id="${report.id}" title="تعديل">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm btn-delete" data-id="${report.id}" title="حذف">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // تحميل البلاغات المحذوفة مع الفلترة
    async loadDeletedReports() {
        const deletedReports = await db.getDeletedReports();
        this.currentFilteredDeleted = deletedReports;
        this.renderDeletedReportsTable(deletedReports);
    }

    // عرض البلاغات المحذوفة
    renderDeletedReportsTable(reports) {
        const tbody = document.getElementById('deletedReportsTableBody');
        
        if (reports.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="22" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-trash" style="font-size: 4rem; color: #6c757d; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>
                        <h4 style="color: #6c757d; margin-bottom: 0.5rem;">لا توجد بلاغات محذوفة</h4>
                        <p style="color: #8a93a2; font-size: 0.9rem;">لم يتم حذف أي بلاغات بعد</p>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = reports.map(report => `
            <tr class="table-row">
                <td><strong>${report.caseNumber || ''}</strong></td>
                <td>${report.dateTime ? new Date(report.dateTime).toLocaleString('ar-EG') : ''}</td>
                <td>${report.customerName || ''}</td>
                <td>${report.customerAddress || ''}</td>
                <td>${report.productType || ''}</td>
                <td>${report.model || ''}</td>
                <td>${report.warranty || ''}</td>
                <td title="${report.problemDescription || ''}">
                    ${report.problemDescription ? (report.problemDescription.length > 50 ? 
                      report.problemDescription.substring(0, 50) + '...' : report.problemDescription) : ''}
                </td>
                <td>${report.visitFee || '0'}</td>
                <td>${report.spareParts || ''}</td>
                <td>${report.partsIssued || ''}</td>
                <td>${report.inspectionTech || ''}</td>
                <td>${report.repairTech || ''}</td>
                <td>${report.repairFee || '0'}</td>
                <td title="${report.note1 || ''}">
                    ${report.note1 ? (report.note1.length > 30 ? 
                      report.note1.substring(0, 30) + '...' : report.note1) : ''}
                </td>
                <td title="${report.note2 || ''}">
                    ${report.note2 ? (report.note2.length > 30 ? 
                      report.note2.substring(0, 30) + '...' : report.note2) : ''}
                </td>
                <td title="${report.techFollowup || ''}">
                    ${report.techFollowup ? (report.techFollowup.length > 30 ? 
                      report.techFollowup.substring(0, 30) + '...' : report.techFollowup) : ''}
                </td>
                <td><strong>${report.totalFees || '0'}</strong></td>
                <td>${report.repairDate || ''}</td>
                <td>${report.deleteReason || 'غير محدد'}</td>
                <td>${report.deletedAt ? new Date(report.deletedAt).toLocaleString('ar-EG') : ''}</td>
                <td>
                    <button class="btn btn-success btn-sm btn-restore" data-id="${report.id}">
                        <i class="fas fa-undo"></i> استعادة
                    </button>
                </td>
            </tr>
        `).join('');
    }

    // تعديل بلاغ - فتح الشاشة المنبثقة - معدل
    async editReport(reportId) {
        const reports = await db.getAllReports();
        const report = reports.find(r => r.id === reportId);
        
        if (!report) {
            this.showToast('لم يتم العثور على البلاغ', 'error');
            return;
        }

        // تعبئة النموذج في الشاشة المنبثقة
        document.getElementById('editCaseNumber').value = report.caseNumber || '';
        
        // تحويل التاريخ للتنسيق المناسب
        const dateTimeValue = report.dateTime ? this.formatDateTimeForInput(report.dateTime) : '';
        document.getElementById('editDateTime').value = dateTimeValue;
        
        document.getElementById('editCustomerName').value = report.customerName || '';
        document.getElementById('editCustomerAddress').value = report.customerAddress || '';
        document.getElementById('editProductType').value = report.productType || '';
        document.getElementById('editModel').value = report.model || '';
        
        // تعبئة بيانات الضمان
        document.querySelectorAll('input[name="editWarranty"]').forEach(radio => {
            radio.checked = radio.value === report.warranty;
        });
        
        document.getElementById('editProblemDescription').value = report.problemDescription || '';
        document.getElementById('editVisitFee').value = report.visitFee || '';
        document.getElementById('editSpareParts').value = report.spareParts || '';
        
        // تعبئة بيانات قطع الغيار
        document.querySelectorAll('input[name="editPartsIssued"]').forEach(radio => {
            radio.checked = radio.value === report.partsIssued;
        });
        
        document.getElementById('editInspectionTech').value = report.inspectionTech || '';
        document.getElementById('editRepairTech').value = report.repairTech || '';
        document.getElementById('editRepairFee').value = report.repairFee || '';
        document.getElementById('editNote1').value = report.note1 || '';
        document.getElementById('editNote2').value = report.note2 || '';
        document.getElementById('editTechFollowup').value = report.techFollowup || '';
        document.getElementById('editTotalFees').value = report.totalFees || '';
        document.getElementById('editRepairDate').value = report.repairDate || '';
        document.getElementById('editStatus').value = report.status || '';

        // تعبئة بيانات أذونات قطع الغيار
        document.getElementById('editPermissionNumber').value = '';
        document.getElementById('editPermissionDate').value = '';
        document.getElementById('editReceiverName').value = '';
        document.getElementById('editPermissionParts').value = '';

        // التحقق من وجود إذن سابق
        const existingPermission = await db.getPartsPermissionByCaseNumber(report.caseNumber);
        if (existingPermission) {
            this.showToast(`يوجد إذن سابق برقم ${existingPermission.permissionNumber} لهذا العميل`, 'warning');
            document.getElementById('editPermissionNumber').value = existingPermission.permissionNumber || '';
            document.getElementById('editPermissionDate').value = existingPermission.permissionDate || '';
            document.getElementById('editReceiverName').value = existingPermission.receiverName || '';
            document.getElementById('editPermissionParts').value = existingPermission.spareParts || '';
        }

        this.currentEditingId = reportId;
        
        // فتح الشاشة المنبثقة
        this.openEditModal();
    }

    // فتح الشاشة المنبثقة
    openEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    // إغلاق الشاشة المنبثقة
    closeEditModal() {
        const modal = document.getElementById('editModal');
        modal.classList.remove('active');
        document.body.style.overflow = '';
        this.currentEditingId = null;
    }

    // حفظ التعديلات من الشاشة المنبثقة - معدل ومصحح
    async saveEdit() {
        const formData = {
            caseNumber: document.getElementById('editCaseNumber').value,
            dateTime: document.getElementById('editDateTime').value,
            customerName: document.getElementById('editCustomerName').value,
            customerAddress: document.getElementById('editCustomerAddress').value,
            productType: document.getElementById('editProductType').value,
            model: document.getElementById('editModel').value,
            warranty: document.querySelector('input[name="editWarranty"]:checked')?.value || '',
            problemDescription: document.getElementById('editProblemDescription').value,
            visitFee: document.getElementById('editVisitFee').value,
            spareParts: document.getElementById('editSpareParts').value,
            partsIssued: document.querySelector('input[name="editPartsIssued"]:checked')?.value || '',
            inspectionTech: document.getElementById('editInspectionTech').value,
            repairTech: document.getElementById('editRepairTech').value,
            repairFee: document.getElementById('editRepairFee').value,
            note1: document.getElementById('editNote1').value,
            note2: document.getElementById('editNote2').value,
            techFollowup: document.getElementById('editTechFollowup').value,
            totalFees: document.getElementById('editTotalFees').value,
            repairDate: document.getElementById('editRepairDate').value,
            status: document.getElementById('editStatus').value
        };

        // التحقق من الحقول الإلزامية
        if (!formData.caseNumber || !formData.dateTime || !formData.customerName || !formData.customerAddress) {
            this.showToast('يرجى ملء الحقول الإلزامية', 'error');
            
            // إضافة أنيميشن للحقول المطلوبة
            ['editCaseNumber', 'editDateTime', 'editCustomerName', 'editCustomerAddress'].forEach(field => {
                const element = document.getElementById(field);
                if (!formData[field.replace('edit', '').toLowerCase()]) {
                    element.classList.add('error');
                    setTimeout(() => element.classList.remove('error'), 1000);
                }
            });
            
            return;
        }

        // إضافة تأثير تحميل للزر
        const saveBtn = document.getElementById('saveEditBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الحفظ...';
        saveBtn.disabled = true;

        // محاكاة التأخير للحصول على تجربة أفضل
        await new Promise(resolve => setTimeout(resolve, 1000));

        if (this.currentEditingId) {
            const savedReport = await db.updateReport(this.currentEditingId, formData);
            
            if (savedReport) {
                // حفظ إذن قطع الغيار إذا تم إدخال بياناته
                const permissionNumber = document.getElementById('editPermissionNumber').value;
                const permissionDate = document.getElementById('editPermissionDate').value;
                const receiverName = document.getElementById('editReceiverName').value;
                const permissionParts = document.getElementById('editPermissionParts').value;

                if (permissionNumber && permissionDate && receiverName && permissionParts) {
                    const permissionData = {
                        permissionNumber: permissionNumber,
                        permissionDate: permissionDate,
                        receiverName: receiverName,
                        spareParts: permissionParts,
                        customerName: formData.customerName,
                        caseNumber: formData.caseNumber,
                        cost: '0',
                        partStatus: 'red'
                    };

                    const existingPermission = await db.getPartsPermissionByCaseNumber(formData.caseNumber);
                    if (existingPermission) {
                        await db.updatePartsPermission(existingPermission.id, permissionData);
                        this.showToast('تم تحديث إذن قطع الغيار بنجاح');
                    } else {
                        await db.addPartsPermission(permissionData);
                        this.showToast('تم إضافة إذن قطع الغيار بنجاح');
                    }
                }

                this.showToast('تم تحديث البلاغ بنجاح');
                this.closeEditModal();
                this.loadReports();
                this.loadPartsPermissions();
                this.updateStats();
                this.updateStatistics();
            } else {
                this.showToast('حدث خطأ أثناء تحديث البلاغ', 'error');
            }
        }

        // استعادة حالة الزر
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }

    // حذف بلاغ
    async deleteReport(reportId) {
        const reports = await db.getAllReports();
        const report = reports.find(r => r.id === reportId);
        if (!report) {
            this.showToast('لم يتم العثور على البلاغ', 'error');
            return;
        }

        if (confirm(`هل أنت متأكد من حذف البلاغ رقم ${report.caseNumber}؟`)) {
            const reason = prompt('يرجى إدخال سبب الحذف:');
            if (reason !== null) {
                await db.deleteReport(reportId, reason);
                this.loadReports();
                this.updateStats();
                this.updateStatistics();
                this.showToast('تم حذف البلاغ بنجاح');
            }
        }
    }

    // استعادة بلاغ
    async restoreReport(reportId) {
        if (confirm('هل تريد استعادة هذا البلاغ؟')) {
            await db.restoreReport(reportId);
            this.loadDeletedReports();
            this.updateStats();
            this.updateStatistics();
            this.showToast('تم استعادة البلاغ بنجاح');
        }
    }

    // مسح فلاتر البلاغات
    clearFilters() {
        document.getElementById('searchInput').value = '';
        document.getElementById('filterStatus').value = '';
        document.getElementById('filterDate').value = '';
        document.getElementById('filterMonth').value = '';
        this.loadReports();
        this.showToast('تم مسح جميع الفلاتر');
    }

    // مسح فلاتر أذونات قطع الغيار
    clearPartsFilters() {
        document.getElementById('partsSearchInput').value = '';
        document.getElementById('filterPartsCustomer').value = '';
        document.getElementById('filterPartsMonth').value = '';
        document.getElementById('filterPartsDate').value = '';
        this.loadPartsPermissions();
        this.showToast('تم مسح جميع فلاتر الأذونات');
    }

    // مسح فلاتر الفنيين
    clearTechnicianFilters() {
        document.getElementById('technicianSearchInput').value = '';
        document.getElementById('filterTechnicianMonth').value = '';
        document.getElementById('filterTechnicianDate').value = '';
        this.loadTechnicians();
        this.showToast('تم مسح الفلاتر');
    }

    // تحويل تنسيق التاريخ للإدخال
    formatDateTimeForInput(dateTimeString) {
        if (!dateTimeString) return '';
        
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return dateTimeString;
        
        // تحويل التاريخ إلى تنسيق YYYY-MM-DDTHH:MM
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day}T${hours}:${minutes}`;
    }

    // الحصول على نص الحالة
    getStatusText(status) {
        const statusMap = {
            'status-green': 'تم الصيانة',
            'status-yellow': 'في انتظار الكشف',
            'status-red': 'تم الإلغاء',
            'status-blue': 'في انتظار قطع الغيار',
            'status-purple': 'قطع غيار غير متوفرة',
            'status-orange': 'العميل يرفض الدفع'
        };
        return statusMap[status] || 'غير محدد';
    }

    // الحصول على نص حالة القطعة
    getPartStatusText(status) {
        const statusMap = {
            'red': 'أحمر - لم يتم التركيب',
            'green': 'أخضر - تم التركيب'
        };
        return statusMap[status] || 'غير محدد';
    }

    // عرض رسائل Toast
    showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }

    // إظهار أنيميشن النجاح
    showSuccessAnimation() {
        const saveBtn = document.getElementById('saveReportBtn');
        saveBtn.classList.add('success');
        setTimeout(() => saveBtn.classList.remove('success'), 2000);
    }

    // ========== الميزات الجديدة ==========

    // أذونات قطع الغيار - معدل ومصحح
    async loadPartsPermissions() {
        try {
            const searchQuery = document.getElementById('partsSearchInput').value;
            const filterCustomer = document.getElementById('filterPartsCustomer').value;
            const filterMonth = document.getElementById('filterPartsMonth').value;
            const filterDate = document.getElementById('filterPartsDate').value;

            const filters = {};
            if (filterCustomer) filters.customer = filterCustomer;
            if (filterMonth) filters.month = filterMonth;
            if (filterDate) filters.date = filterDate;

            const permissions = await db.searchPartsPermissions(searchQuery, filters);
            this.currentFilteredParts = permissions;
            this.renderPartsPermissionsTable(permissions);
            
        } catch (error) {
            console.error('خطأ في تحميل أذونات قطع الغيار:', error);
            this.showToast('حدث خطأ في تحميل أذونات قطع الغيار', 'error');
        }
    }

    // عرض أذونات قطع الغيار في الجدول - معدل ومصحح
    renderPartsPermissionsTable(permissions) {
        const tbody = document.getElementById('partsPermissionsTableBody');
        
        if (!tbody) {
            console.error('لم يتم العثور على عنصر partsPermissionsTableBody');
            return;
        }
        
        if (!permissions || permissions.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="9" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-clipboard-list" style="font-size: 4rem; color: #6c757d; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>
                        <h4 style="color: #6c757d; margin-bottom: 0.5rem;">لا توجد أذونات</h4>
                        <p style="color: #8a93a2; font-size: 0.9rem;">لم يتم إضافة أي أذونات قطع غيار بعد</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = permissions.map(permission => {
            return `
                <tr class="table-row">
                    <td><strong>${permission.permissionNumber || 'غير محدد'}</strong></td>
                    <td>${permission.customerName || 'غير محدد'}</td>
                    <td>${permission.caseNumber || 'غير محدد'}</td>
                    <td>${permission.spareParts || 'غير محدد'}</td>
                    <td>${permission.cost || '0'} ج.م</td>
                    <td>${permission.receiverName || 'غير محدد'}</td>
                    <td>${permission.permissionDate || 'غير محدد'}</td>
                    <td>
                        <span class="status-badge ${permission.partStatus === 'green' ? 'status-green' : 'status-red'}">
                            ${this.getPartStatusText(permission.partStatus)}
                        </span>
                    </td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-warning btn-sm btn-edit-parts" data-id="${permission.id}" title="تعديل">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-danger btn-sm btn-delete-parts" data-id="${permission.id}" title="حذف">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // تعديل إذن قطع الغيار
    async editPartsPermission(partsId) {
        const permissions = await db.getAllPartsPermissions();
        const permission = permissions.find(p => p.id === partsId);
        if (!permission) {
            this.showToast('لم يتم العثور على إذن قطع الغيار', 'error');
            return;
        }

        // فتح شاشة تعديل إذن قطع الغيار
        this.openEditPartsModal(permission);
    }

    // فتح شاشة تعديل إذن قطع الغيار
    openEditPartsModal(permission) {
        // يمكن إضافة شاشة منبثقة مخصصة لتعديل أذونات قطع الغيار
        // حالياً سنستخدم نفس شاشة تعديل البلاغ مع تعبئة البيانات
        this.showSection('add-report');
        this.showToast('يمكنك تعديل إذن قطع الغيار من خلال تعديل البلاغ المرتبط', 'info');
    }

    // المصروفات
    async saveExpense() {
        const expenseName = document.getElementById('expenseName').value;
        const expenseReason = document.getElementById('expenseReason').value;
        const expenseAmount = document.getElementById('expenseAmount').value;
        
        if (!expenseName || !expenseReason || !expenseAmount) {
            this.showToast('يرجى ملء جميع الحقول', 'error');
            return;
        }
        
        const expense = {
            id: this.generateId(),
            name: expenseName,
            reason: expenseReason,
            amount: parseFloat(expenseAmount),
            createdAt: new Date().toISOString()
        };
        
        await db.addExpense(expense);
        this.showToast('تم حفظ المصروف بنجاح');
        this.resetExpenseForm();
        this.loadExpenses();
        this.updateStatistics();
    }

    resetExpenseForm() {
        document.getElementById('expenseForm').reset();
    }

    async loadExpenses() {
        const expenses = await db.getAllExpenses();
        this.renderExpensesTable(expenses);
    }

    renderExpensesTable(expenses) {
        const tbody = document.getElementById('expensesTableBody');
        
        if (expenses.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-receipt" style="font-size: 4rem; color: #6c757d; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>
                        <h4 style="color: #6c757d; margin-bottom: 0.5rem;">لا توجد مصروفات</h4>
                        <p style="color: #8a93a2; font-size: 0.9rem;">لم يتم إضافة أي مصروفات بعد</p>
                    </td>
                </tr>
            `;
            return;
        }
        
        tbody.innerHTML = expenses.map(expense => `
            <tr class="table-row">
                <td>${expense.name}</td>
                <td>${expense.reason}</td>
                <td>${expense.amount} ج.م</td>
                <td>${new Date(expense.created_at).toLocaleString('ar-EG')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-danger btn-sm btn-delete-expense" data-id="${expense.id}">
                            <i class="fas fa-trash"></i> حذف
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ========== إدارة الفنيين ==========

    // حفظ فني جديد
    async saveTechnician() {
        const name = document.getElementById('technicianName').value;
        const phone = document.getElementById('technicianPhone').value;
        const specialty = document.getElementById('technicianSpecialty').value;
        
        if (!name) {
            this.showToast('يرجى إدخال اسم الفني', 'error');
            return;
        }
        
        const technician = {
            name: name,
            phone: phone,
            specialty: specialty
        };
        
        await db.addTechnician(technician);
        this.showToast('تم حفظ الفني بنجاح');
        this.resetTechnicianForm();
        this.loadTechnicians();
        this.populateTechniciansDropdowns();
    }

    // إعادة تعيين نموذج الفني
    resetTechnicianForm() {
        document.getElementById('technicianForm').reset();
    }

    // تحميل الفنيين وعرضهم
    async loadTechnicians() {
        const searchQuery = document.getElementById('technicianSearchInput').value;
        const filterMonth = document.getElementById('filterTechnicianMonth').value;
        const filterDate = document.getElementById('filterTechnicianDate').value;

        let technicians = await db.getAllTechnicians();
        
        if (searchQuery) {
            technicians = await db.searchTechnicians(searchQuery);
        }
        
        // تطبيق فلترة الشهر والتاريخ
        technicians = technicians.map(tech => {
            const stats = this.getTechnicianStatsWithFilters(tech.name, filterMonth, filterDate);
            return {
                ...tech,
                stats: stats
            };
        });
        
        this.currentFilteredTechnicians = technicians;
        this.renderTechniciansTable(technicians);
    }

    // دالة جديدة للحصول على إحصائيات الفني مع الفلاتر
    getTechnicianStatsWithFilters(technicianName, month = null, date = null) {
        const reports = db.loadFromStorage('reports') || [];
        
        let filteredReports = reports;
        
        // تطبيق فلترة الشهر
        if (month) {
            filteredReports = filteredReports.filter(report => 
                report.dateTime && report.dateTime.startsWith(month)
            );
        }
        
        // تطبيق فلترة التاريخ
        if (date) {
            filteredReports = filteredReports.filter(report => 
                (report.dateTime && report.dateTime.startsWith(date)) ||
                (report.repairDate && report.repairDate === date)
            );
        }
        
        const inspectionReports = filteredReports.filter(report => 
            report.inspectionTech === technicianName
        );
        
        const repairReports = filteredReports.filter(report => 
            report.repairTech === technicianName
        );
        
        const totalCollected = filteredReports
            .filter(report => report.repairTech === technicianName || report.inspectionTech === technicianName)
            .reduce((sum, report) => {
                const visitFee = parseFloat(report.visitFee) || 0;
                const repairFee = parseFloat(report.repairFee) || 0;
                return sum + visitFee + repairFee;
            }, 0);
        
        return {
            inspectionCount: inspectionReports.length,
            repairCount: repairReports.length,
            totalCollected: totalCollected
        };
    }

    // عرض جدول الفنيين
    renderTechniciansTable(technicians) {
        const tbody = document.getElementById('techniciansTableBody');
        const statsContainer = document.getElementById('techniciansStats');
        
        if (technicians.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="7" style="text-align: center; padding: 3rem;">
                        <i class="fas fa-users" style="font-size: 4rem; color: #6c757d; margin-bottom: 1rem; opacity: 0.5;"></i>
                        <br>
                        <h4 style="color: #6c757d; margin-bottom: 0.5rem;">لا توجد فنيين</h4>
                        <p style="color: #8a93a2; font-size: 0.9rem;">لم يتم إضافة أي فنيين بعد</p>
                    </td>
                </tr>
            `;
            
            statsContainer.innerHTML = '';
            return;
        }
        
        // عرض الإحصائيات على شكل بطاقات
        const totalStats = technicians.reduce((acc, tech) => {
            acc.inspectionCount += tech.stats.inspectionCount;
            acc.repairCount += tech.stats.repairCount;
            acc.totalCollected += tech.stats.totalCollected;
            return acc;
        }, { inspectionCount: 0, repairCount: 0, totalCollected: 0 });
        
        statsContainer.innerHTML = `
            <div class="stat-card">
                <div class="stat-icon">
                    <i class="fas fa-users"></i>
                </div>
                <div class="stat-info">
                    <h3>${technicians.length}</h3>
                    <p>إجمالي الفنيين</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon status-blue">
                    <i class="fas fa-search"></i>
                </div>
                <div class="stat-info">
                    <h3>${totalStats.inspectionCount}</h3>
                    <p>إجمالي بلاغات الكشف</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon status-green">
                    <i class="fas fa-wrench"></i>
                </div>
                <div class="stat-info">
                    <h3>${totalStats.repairCount}</h3>
                    <p>إجمالي بلاغات الصيانة</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon success">
                    <i class="fas fa-money-bill-wave"></i>
                </div>
                <div class="stat-info">
                    <h3>${totalStats.totalCollected.toFixed(2)}</h3>
                    <p>إجمالي المبلغ المحصل</p>
                </div>
            </div>
        `;
        
        tbody.innerHTML = technicians.map(technician => {
            return `
                <tr class="table-row">
                    <td><strong>${technician.name}</strong></td>
                    <td>${technician.phone || 'غير محدد'}</td>
                    <td>${technician.specialty || 'غير محدد'}</td>
                    <td>${technician.stats.inspectionCount}</td>
                    <td>${technician.stats.repairCount}</td>
                    <td>${technician.stats.totalCollected.toFixed(2)} ج.م</td>
                    <td>
                        <div class="action-buttons">
                            <button class="btn btn-danger btn-sm btn-delete-technician" data-id="${technician.id}">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // تعبئة قائمة الفنيين في الحقول
    async populateTechniciansDropdowns() {
        const technicians = await db.getAllTechnicians();
        const inspectionSelect = document.getElementById('inspectionTech');
        const repairSelect = document.getElementById('repairTech');
        const editInspectionSelect = document.getElementById('editInspectionTech');
        const editRepairSelect = document.getElementById('editRepairTech');
        
        const updateDropdown = (selectElement) => {
            // حفظ القيمة الحالية
            const currentValue = selectElement.value;
            
            // مسح الخيارات الحالية (باستثناء الخيار الأول)
            while (selectElement.options.length > 1) {
                selectElement.remove(1);
            }
            
            // إضافة الفنيين
            technicians.forEach(tech => {
                const option = document.createElement('option');
                option.value = tech.name;
                option.textContent = tech.name;
                selectElement.appendChild(option);
            });
            
            // استعادة القيمة إذا كانت موجودة
            if (currentValue && technicians.some(tech => tech.name === currentValue)) {
                selectElement.value = currentValue;
            }
        };
        
        [inspectionSelect, repairSelect, editInspectionSelect, editRepairSelect].forEach(updateDropdown);
    }

    // حذف فني
    async deleteTechnician(technicianId) {
        const technicians = await db.getAllTechnicians();
        const technician = technicians.find(t => t.id === technicianId);
        if (!technician) {
            this.showToast('لم يتم العثور على الفني', 'error');
            return;
        }

        if (confirm(`هل أنت متأكد من حذف الفني "${technician.name}"؟`)) {
            this.openDeleteTechnicianModal(technicianId);
        }
    }

    // فتح شاشة حذف الفني
    openDeleteTechnicianModal(technicianId) {
        this.currentDeletingTechnicianId = technicianId;
        document.getElementById('deleteTechnicianModal').classList.add('active');
    }

    // إغلاق شاشة حذف الفني
    closeDeleteTechnicianModal() {
        document.getElementById('deleteTechnicianModal').classList.remove('active');
        this.currentDeletingTechnicianId = null;
        document.getElementById('deleteTechnicianPassword').value = '';
    }

    // تأكيد حذف الفني
    async confirmDeleteTechnician() {
        const password = document.getElementById('deleteTechnicianPassword').value;
        
        if (password !== '01101187300') {
            this.showToast('كلمة المرور غير صحيحة', 'error');
            return;
        }
        
        if (await db.deleteTechnician(this.currentDeletingTechnicianId)) {
            this.showToast('تم حذف الفني بنجاح');
            this.loadTechnicians();
            this.populateTechniciansDropdowns();
        } else {
            this.showToast('حدث خطأ أثناء حذف الفني', 'error');
        }
        
        this.closeDeleteTechnicianModal();
    }

    // الإحصائيات - معدلة لتطبيق الفلتر على جميع الإحصائيات
    async updateStatistics() {
        const reports = await db.getAllReports();
        const expenses = await db.getAllExpenses();
        const partsPermissions = await db.getAllPartsPermissions();
        const selectedMonth = document.getElementById('statsMonthFilter').value;
        
        // تصفية البلاغات حسب الشهر المحدد
        let filteredReports = reports;
        if (selectedMonth) {
            filteredReports = reports.filter(report => 
                report.dateTime && report.dateTime.startsWith(selectedMonth)
            );
        }
        
        // تصفية المصروفات حسب الشهر المحدد
        let filteredExpenses = expenses;
        if (selectedMonth) {
            filteredExpenses = expenses.filter(expense => 
                expense.created_at && expense.created_at.startsWith(selectedMonth)
            );
        }

        // تصفية أذونات الصرف حسب الشهر المحدد
        let filteredPartsPermissions = partsPermissions;
        if (selectedMonth) {
            filteredPartsPermissions = partsPermissions.filter(permission => 
                permission.permissionDate && permission.permissionDate.startsWith(selectedMonth)
            );
        }
        
        // إحصائيات البلاغات (مصفاة حسب الشهر)
        const totalReports = filteredReports.length;
        const completedReports = filteredReports.filter(r => r.status === 'status-green').length;
        const waitingParts = filteredReports.filter(r => r.status === 'status-blue').length;
        const cancelledReports = filteredReports.filter(r => r.status === 'status-red').length;
        const refusedPayment = filteredReports.filter(r => r.status === 'status-orange').length;
        const unavailableParts = filteredReports.filter(r => r.status === 'status-purple').length;
        const waitingInspection = filteredReports.filter(r => r.status === 'status-yellow').length;
        
        // المبالغ المحصلة (مصفاة حسب الشهر)
        const totalCollected = filteredReports.reduce((sum, report) => sum + (parseFloat(report.totalFees) || 0), 0);
        
        // إجمالي المصروفات (مصفاة حسب الشهر)
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);

        // إجمالي أذونات الصرف (مصفاة حسب الشهر)
        const totalPartsPermissions = filteredPartsPermissions.length;
        
        // تحديث الواجهة
        document.getElementById('totalReportsCount').textContent = totalReports;
        document.getElementById('completedReportsCount').textContent = completedReports;
        document.getElementById('waitingPartsCount').textContent = waitingParts;
        document.getElementById('cancelledReportsCount').textContent = cancelledReports;
        document.getElementById('refusedPaymentCount').textContent = refusedPayment;
        document.getElementById('unavailablePartsCount').textContent = unavailableParts;
        document.getElementById('waitingInspectionCount').textContent = waitingInspection;
        document.getElementById('totalCollectedAmount').textContent = totalCollected.toFixed(2);
        document.getElementById('monthlyCollectedAmount').textContent = totalCollected.toFixed(2);
        document.getElementById('totalExpensesAmount').textContent = totalExpenses.toFixed(2);
        document.getElementById('totalPartsPermissionsCount').textContent = totalPartsPermissions;
        
        // تحديث تسمية الشهر
        const monthNames = {
            '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
            '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
            '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
        };
        
        let statsLabel = 'جميع الأشهر';
        if (selectedMonth) {
            const [year, month] = selectedMonth.split('-');
            statsLabel = `${monthNames[month]} ${year}`;
        }
        
        document.getElementById('monthlyCollectedLabel').textContent = `المبلغ المحصل في ${statsLabel}`;
        document.getElementById('partsPermissionsLabel').textContent = `إجمالي أذونات الصرف - ${statsLabel}`;
    }

    // حذف المصروفات
    openDeleteExpenseModal(expenseId) {
        this.currentDeletingExpenseId = expenseId;
        document.getElementById('deleteExpenseModal').classList.add('active');
    }

    closeDeleteExpenseModal() {
        document.getElementById('deleteExpenseModal').classList.remove('active');
        this.currentDeletingExpenseId = null;
        document.getElementById('deleteExpensePassword').value = '';
    }

    async confirmDeleteExpense() {
        const password = document.getElementById('deleteExpensePassword').value;
        
        if (password !== '01101187300') {
            this.showToast('كلمة المرور غير صحيحة', 'error');
            return;
        }
        
        if (await db.deleteExpense(this.currentDeletingExpenseId)) {
            this.showToast('تم حذف المصروف بنجاح');
            this.loadExpenses();
            this.updateStatistics();
        } else {
            this.showToast('حدث خطأ أثناء حذف المصروف', 'error');
        }
        
        this.closeDeleteExpenseModal();
    }

    // حذف أذونات قطع الغيار
    openDeletePartsModal(partsId) {
        this.currentDeletingPartsId = partsId;
        document.getElementById('deletePartsModal').classList.add('active');
    }

    closeDeletePartsModal() {
        document.getElementById('deletePartsModal').classList.remove('active');
        this.currentDeletingPartsId = null;
        document.getElementById('deletePartsPassword').value = '';
    }

    async confirmDeleteParts() {
        const password = document.getElementById('deletePartsPassword').value;
        
        if (password !== '01101187300') {
            this.showToast('كلمة المرور غير صحيحة', 'error');
            return;
        }
        
        if (await db.deletePartsPermission(this.currentDeletingPartsId)) {
            this.showToast('تم حذف إذن قطع الغيار بنجاح');
            this.loadPartsPermissions();
            this.updateStatistics();
        } else {
            this.showToast('حدث خطأ أثناء حذف إذن قطع الغيار', 'error');
        }
        
        this.closeDeletePartsModal();
    }

    // توليد معرف فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // تنظيف الذاكرة عند إغلاق الصفحة
    destroy() {
        if (this.dateTimeInterval) {
            clearInterval(this.dateTimeInterval);
        }
        if (this.statsInterval) {
            clearInterval(this.statsInterval);
        }
    }
}

// إضافة CSS إضافي للبادجات والأزرار
const additionalCSS = `
    .status-badge {
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 600;
        text-align: center;
        display: inline-block;
        min-width: 100px;
    }
    
    .status-badge.status-green {
        background: rgba(40, 167, 69, 0.1);
        color: var(--success-color);
        border: 1px solid rgba(40, 167, 69, 0.3);
    }
    
    .status-badge.status-yellow {
        background: rgba(255, 193, 7, 0.1);
        color: var(--warning-color);
        border: 1px solid rgba(255, 193, 7, 0.3);
    }
    
    .status-badge.status-red {
        background: rgba(220, 53, 69, 0.1);
        color: var(--danger-color);
        border: 1px solid rgba(220, 53, 69, 0.3);
    }
    
    .status-badge.status-blue {
        background: rgba(0, 123, 255, 0.1);
        color: var(--primary-color);
        border: 1px solid rgba(0, 123, 255, 0.3);
    }
    
    .status-badge.status-purple {
        background: rgba(128, 0, 128, 0.1);
        color: purple;
        border: 1px solid rgba(128, 0, 128, 0.3);
    }
    
    .status-badge.status-orange {
        background: rgba(255, 165, 0, 0.1);
        color: orange;
        border: 1px solid rgba(255, 165, 0, 0.3);
    }
    
    .action-buttons {
        display: flex;
        gap: 0.5rem;
        justify-content: center;
    }
    
    .fa-spin {
        animation: spin 1s linear infinite;
    }
    
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

// إضافة CSS الإضافي للصفحة
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);

// تهيئة التطبيق عند تحميل الصفحة
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new MaintenanceApp();
});

// جعل التطبيق متاحاً عالمياً للتصحيح
window.app = app;

// تنظيف الذاكرة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (app) {
        app.destroy();
    }
});