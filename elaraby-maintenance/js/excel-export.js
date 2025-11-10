import { db } from './db.js';

// نظام تصدير Excel
class ExcelExporter {
    constructor() {
        this.init();
    }

    init() {
        // يمكن إضافة أي تهيئة لازمة هنا
    }

    // تصدير البلاغات المصفاة فقط
    exportFilteredReports() {
        if (!app.currentFilteredReports || app.currentFilteredReports.length === 0) {
            this.showToast('لا توجد بلاغات معروضة لتصديرها', 'error');
            return;
        }

        const wsData = this.prepareReportsData(app.currentFilteredReports);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'البلاغات');
        XLSX.writeFile(wb, `البلاغات_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast('تم تصدير البلاغات المعروضة بنجاح');
    }

    // تصدير أذونات قطع الغيار المصفاة فقط
    exportFilteredParts() {
        if (!app.currentFilteredParts || app.currentFilteredParts.length === 0) {
            this.showToast('لا توجد أذونات معروضة لتصديرها', 'error');
            return;
        }

        const wsData = this.preparePartsData(app.currentFilteredParts);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'أذونات_قطع_الغيار');
        XLSX.writeFile(wb, `أذونات_قطع_الغيار_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast('تم تصدير الأذونات المعروضة بنجاح');
    }

    // تصدير البلاغات المحذوفة المصفاة فقط
    exportFilteredDeletedReports() {
        if (!app.currentFilteredDeleted || app.currentFilteredDeleted.length === 0) {
            this.showToast('لا توجد بلاغات محذوفة معروضة لتصديرها', 'error');
            return;
        }

        const wsData = this.prepareDeletedReportsData(app.currentFilteredDeleted);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'البلاغات_المحذوفة');
        XLSX.writeFile(wb, `البلاغات_المحذوفة_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast('تم تصدير البلاغات المحذوفة المعروضة بنجاح');
    }

    // تصدير الفنيين المصفاة فقط
    exportFilteredTechnicians() {
        if (!app.currentFilteredTechnicians || app.currentFilteredTechnicians.length === 0) {
            this.showToast('لا توجد فنيين معروضة لتصديرها', 'error');
            return;
        }

        const wsData = this.prepareTechniciansData(app.currentFilteredTechnicians);
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(wsData);
        
        XLSX.utils.book_append_sheet(wb, ws, 'الفنيين');
        XLSX.writeFile(wb, `الفنيين_${new Date().toISOString().split('T')[0]}.xlsx`);
        this.showToast('تم تصدير الفنيين المعروضة بنجاح');
    }

    // إعداد بيانات البلاغات
    prepareReportsData(reports) {
        const headers = [
            'رقم الحالة', 'التاريخ والوقت', 'اسم العميل', 'عنوان العميل', 
            'نوع المنتج', 'الموديل', 'الضمان', 'العطل', 'رسوم الزيارة', 
            'قطع الغيار', 'صرف قطع الغيار', 'فني الكشف', 'فني الصيانة', 
            'رسوم الصيانة', 'تعلق 1', 'تعلق 2', 'المتابعة الفنية', 
            'إجمالي الرسوم', 'تاريخ الصيانة', 'الحالة'
        ];

        const data = [headers];
        
        reports.forEach(report => {
            data.push([
                report.caseNumber || '',
                report.dateTime ? new Date(report.dateTime).toLocaleString('ar-EG') : '',
                report.customerName || '',
                report.customerAddress || '',
                report.productType || '',
                report.model || '',
                report.warranty || '',
                report.problemDescription || '',
                report.visitFee || '0',
                report.spareParts || '',
                report.partsIssued || '',
                report.inspectionTech || '',
                report.repairTech || '',
                report.repairFee || '0',
                report.note1 || '',
                report.note2 || '',
                report.techFollowup || '',
                report.totalFees || '0',
                report.repairDate || '',
                app.getStatusText(report.status)
            ]);
        });

        return data;
    }

    // إعداد بيانات أذونات قطع الغيار
    preparePartsData(permissions) {
        const headers = [
            'رقم الإذن', 'اسم العميل', 'رقم الحالة', 'قطع الغيار', 
            'التكلفة', 'اسم المستلم', 'تاريخ الاستلام', 'حالة القطعة'
        ];

        const data = [headers];
        
        permissions.forEach(permission => {
            data.push([
                permission.permissionNumber || '',
                permission.customerName || '',
                permission.caseNumber || '',
                permission.spareParts || '',
                permission.cost || '0',
                permission.receiverName || '',
                permission.permissionDate || '',
                app.getPartStatusText(permission.partStatus)
            ]);
        });

        return data;
    }

    // إعداد بيانات البلاغات المحذوفة
    prepareDeletedReportsData(reports) {
        const headers = [
            'رقم الحالة', 'التاريخ والوقت', 'اسم العميل', 'عنوان العميل', 
            'نوع المنتج', 'الموديل', 'الضمان', 'العطل', 'رسوم الزيارة', 
            'قطع الغيار', 'صرف قطع الغيار', 'فني الكشف', 'فني الصيانة', 
            'رسوم الصيانة', 'تعلق 1', 'تعلق 2', 'المتابعة الفنية', 
            'إجمالي الرسوم', 'تاريخ الصيانة', 'سبب الحذف', 'تاريخ الحذف'
        ];

        const data = [headers];
        
        reports.forEach(report => {
            data.push([
                report.caseNumber || '',
                report.dateTime ? new Date(report.dateTime).toLocaleString('ar-EG') : '',
                report.customerName || '',
                report.customerAddress || '',
                report.productType || '',
                report.model || '',
                report.warranty || '',
                report.problemDescription || '',
                report.visitFee || '0',
                report.spareParts || '',
                report.partsIssued || '',
                report.inspectionTech || '',
                report.repairTech || '',
                report.repairFee || '0',
                report.note1 || '',
                report.note2 || '',
                report.techFollowup || '',
                report.totalFees || '0',
                report.repairDate || '',
                report.deleteReason || 'غير محدد',
                report.deletedAt ? new Date(report.deletedAt).toLocaleString('ar-EG') : ''
            ]);
        });

        return data;
    }

    // إعداد بيانات الفنيين
    prepareTechniciansData(technicians) {
        const headers = [
            'اسم الفني', 'رقم الهاتف', 'التخصص', 'عدد بلاغات الكشف', 
            'عدد بلاغات الصيانة', 'إجمالي المبلغ المحصل'
        ];

        const data = [headers];
        
        technicians.forEach(technician => {
            const stats = db.getTechnicianStats(technician.name);
            data.push([
                technician.name || '',
                technician.phone || '',
                technician.specialty || '',
                stats.inspectionCount,
                stats.repairCount,
                stats.totalCollected.toFixed(2)
            ]);
        });

        return data;
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
}

// إنشاء instance من مصدر Excel
const excelExporter = new ExcelExporter();

// جعلها متاحة عالمياً
window.excelExporter = excelExporter;