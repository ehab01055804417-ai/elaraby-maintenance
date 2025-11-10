import { supabase } from './supabase-client.js';

class Database {
    constructor() {
        this.supabase = supabase;
        this.init();
    }

    async init() {
        console.log('🎯 تهيئة قاعدة البيانات...');
        
        // إنشاء بيانات تجريبية إذا لم تكن موجودة
        const reports = await this.getAllReports();
        if (reports.length === 0) {
            console.log('📝 إنشاء بيانات تجريبية...');
            this.createSampleData();
        }
    }

    // تحميل البيانات من التخزين المحلي
    loadFromStorage(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading from storage:', error);
            return null;
        }
    }

    // حفظ البيانات إلى التخزين المحلي
    saveToStorage(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving to storage:', error);
            return false;
        }
    }

    // إضافة بلاغ جديد
    async addReport(reportData) {
        try {
            const report = {
                id: this.generateId(),
                caseNumber: reportData.caseNumber || '',
                dateTime: reportData.dateTime || '',
                customerName: reportData.customerName || '',
                customerAddress: reportData.customerAddress || '',
                productType: reportData.productType || '',
                model: reportData.model || '',
                warranty: reportData.warranty || '',
                problemDescription: reportData.problemDescription || '',
                visitFee: reportData.visitFee || '0',
                spareParts: reportData.spareParts || '',
                partsIssued: reportData.partsIssued || '',
                inspectionTech: reportData.inspectionTech || '',
                repairTech: reportData.repairTech || '',
                repairFee: reportData.repairFee || '0',
                note1: reportData.note1 || '',
                note2: reportData.note2 || '',
                techFollowup: reportData.techFollowup || '',
                totalFees: reportData.totalFees || '0',
                repairDate: reportData.repairDate || '',
                status: reportData.status || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('reports')
                .insert([report]);
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding report:', error);
            // Fallback to localStorage
            const reports = this.loadFromStorage('reports') || [];
            const report = {
                id: this.generateId(),
                ...reportData,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            reports.push(report);
            this.saveToStorage('reports', reports);
            return report;
        }
    }

    // تحديث بلاغ موجود
    async updateReport(id, reportData) {
        try {
            const { data, error } = await this.supabase
                .from('reports')
                .update({
                    ...reportData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id);
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating report:', error);
            // Fallback to localStorage
            const reports = this.loadFromStorage('reports') || [];
            const index = reports.findIndex(report => report.id === id);
            if (index !== -1) {
                reports[index] = {
                    ...reports[index],
                    ...reportData,
                    updated_at: new Date().toISOString()
                };
                this.saveToStorage('reports', reports);
                return reports[index];
            }
            return null;
        }
    }

    // حذف بلاغ (نقل إلى المحذوفات)
    async deleteReport(id, deleteReason = '') {
        try {
            // الحصول على البلاغ
            const report = await this.getReportById(id);
            if (!report) {
                throw new Error('Report not found');
            }

            // إضافة إلى البلاغات المحذوفة
            const deletedReport = {
                ...report,
                deletedAt: new Date().toISOString(),
                deleteReason: deleteReason
            };

            const { error: deleteError } = await this.supabase
                .from('deleted_reports')
                .insert([deletedReport]);

            if (deleteError) throw deleteError;

            // حذف من البلاغات النشطة
            const { error } = await this.supabase
                .from('reports')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return deletedReport;
        } catch (error) {
            console.error('Error deleting report:', error);
            // Fallback to localStorage
            const reports = this.loadFromStorage('reports') || [];
            const deletedReports = this.loadFromStorage('deleted_reports') || [];
            const index = reports.findIndex(report => report.id === id);
            
            if (index !== -1) {
                const deletedReport = {
                    ...reports[index],
                    deletedAt: new Date().toISOString(),
                    deleteReason: deleteReason
                };
                
                deletedReports.push(deletedReport);
                reports.splice(index, 1);
                
                this.saveToStorage('reports', reports);
                this.saveToStorage('deleted_reports', deletedReports);
                
                return deletedReport;
            }
            return null;
        }
    }

    // استعادة بلاغ محذوف
    async restoreReport(id) {
        try {
            const { data: deletedReports, error: selectError } = await this.supabase
                .from('deleted_reports')
                .select('*')
                .eq('id', id);

            if (selectError) throw selectError;
            if (!deletedReports || deletedReports.length === 0) {
                throw new Error('Report not found in deleted reports');
            }

            const report = { ...deletedReports[0] };
            // إزالة خصائص الحذف
            delete report.deletedAt;
            delete report.deleteReason;
            
            // تحديث تاريخ التعديل
            report.updated_at = new Date().toISOString();

            // إضافة إلى البلاغات النشطة
            const { error: insertError } = await this.supabase
                .from('reports')
                .insert([report]);

            if (insertError) throw insertError;

            // حذف من المحذوفات
            const { error: deleteError } = await this.supabase
                .from('deleted_reports')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;
            return report;
        } catch (error) {
            console.error('Error restoring report:', error);
            // Fallback to localStorage
            const deletedReports = this.loadFromStorage('deleted_reports') || [];
            const reports = this.loadFromStorage('reports') || [];
            const index = deletedReports.findIndex(report => report.id === id);
            
            if (index !== -1) {
                const report = { ...deletedReports[index] };
                // إزالة خصائص الحذف
                delete report.deletedAt;
                delete report.deleteReason;
                
                report.updated_at = new Date().toISOString();
                
                reports.push(report);
                deletedReports.splice(index, 1);
                
                this.saveToStorage('reports', reports);
                this.saveToStorage('deleted_reports', deletedReports);
                
                return report;
            }
            return null;
        }
    }

    // الحصول على بلاغ بواسطة ID
    async getReportById(id) {
        try {
            const { data, error } = await this.supabase
                .from('reports')
                .select('*')
                .eq('id', id);
            
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error getting report by ID:', error);
            const reports = this.loadFromStorage('reports') || [];
            return reports.find(report => report.id === id) || null;
        }
    }

    // الحصول على جميع البلاغات
    async getAllReports() {
        try {
            const { data, error } = await this.supabase
                .from('reports')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting reports:', error);
            return this.loadFromStorage('reports') || [];
        }
    }

    // الحصول على البلاغات المحذوفة
    async getDeletedReports() {
        try {
            const { data, error } = await this.supabase
                .from('deleted_reports')
                .select('*')
                .order('deletedAt', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting deleted reports:', error);
            return this.loadFromStorage('deleted_reports') || [];
        }
    }

    // البحث في البلاغات
    async searchReports(query, filters = {}) {
        try {
            let data;
            
            if (Object.keys(filters).length === 0 && !query) {
                // إذا لم توجد فلاتر، احصل على جميع البيانات
                const result = await this.supabase
                    .from('reports')
                    .select('*')
                    .order('created_at', { ascending: false });
                data = result.data;
            } else {
                // تطبيق الفلاتر يدوياً
                const allReports = await this.getAllReports();
                data = this.localSearch(allReports, query, filters);
            }

            return data || [];
        } catch (error) {
            console.error('Error searching reports:', error);
            const reports = this.loadFromStorage('reports') || [];
            return this.localSearch(reports, query, filters);
        }
    }

    // البحث المحلي
    localSearch(reports, query, filters = {}) {
        return reports.filter(report => {
            // البحث النصي
            const matchesSearch = !query || 
                Object.values(report).some(value => 
                    value && value.toString().toLowerCase().includes(query.toLowerCase())
                );

            // التصفية حسب الحالة
            const matchesStatus = !filters.status || report.status === filters.status;

            // التصفية حسب التاريخ
            let matchesDate = true;
            if (filters.date) {
                matchesDate = false;
                if (report.dateTime && report.dateTime.startsWith(filters.date)) {
                    matchesDate = true;
                }
                if (report.repairDate && report.repairDate === filters.date) {
                    matchesDate = true;
                }
            }

            // التصفية حسب الشهر
            let matchesMonth = true;
            if (filters.month) {
                matchesMonth = false;
                if (report.dateTime && report.dateTime.startsWith(filters.month)) {
                    matchesMonth = true;
                }
                if (report.repairDate && report.repairDate.startsWith(filters.month)) {
                    matchesMonth = true;
                }
            }

            return matchesSearch && matchesStatus && matchesDate && matchesMonth;
        });
    }

    // ========== أذونات قطع الغيار ==========

    async addPartsPermission(permissionData) {
        try {
            const permission = {
                id: permissionData.id || this.generateId(),
                permissionNumber: permissionData.permissionNumber || '',
                customerName: permissionData.customerName || '',
                caseNumber: permissionData.caseNumber || '',
                spareParts: permissionData.spareParts || '',
                cost: permissionData.cost || '0',
                partStatus: permissionData.partStatus || 'red',
                permissionDate: permissionData.permissionDate || new Date().toISOString().split('T')[0],
                receiverName: permissionData.receiverName || '',
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('parts_permissions')
                .insert([permission]);
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding parts permission:', error);
            const permissions = this.loadFromStorage('partsPermissions') || [];
            permissions.push(permission);
            this.saveToStorage('partsPermissions', permissions);
            return permission;
        }
    }

    async getAllPartsPermissions() {
        try {
            const { data, error } = await this.supabase
                .from('parts_permissions')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting parts permissions:', error);
            return this.loadFromStorage('partsPermissions') || [];
        }
    }

    async deletePartsPermission(id) {
        try {
            const { error } = await this.supabase
                .from('parts_permissions')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting parts permission:', error);
            const permissions = this.loadFromStorage('partsPermissions') || [];
            const index = permissions.findIndex(p => p.id === id);
            if (index !== -1) {
                permissions.splice(index, 1);
                this.saveToStorage('partsPermissions', permissions);
                return true;
            }
            return false;
        }
    }

    async updatePartsPermission(id, permissionData) {
        try {
            const { data, error } = await this.supabase
                .from('parts_permissions')
                .update(permissionData)
                .eq('id', id);
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error updating parts permission:', error);
            const permissions = this.loadFromStorage('partsPermissions') || [];
            const index = permissions.findIndex(p => p.id === id);
            if (index !== -1) {
                permissions[index] = {
                    ...permissions[index],
                    ...permissionData
                };
                this.saveToStorage('partsPermissions', permissions);
                return permissions[index];
            }
            return null;
        }
    }

    async searchPartsPermissions(query, filters = {}) {
        try {
            const permissions = await this.getAllPartsPermissions();
            return permissions.filter(permission => {
                // البحث النصي
                const matchesSearch = !query || 
                    Object.values(permission).some(value => 
                        value && value.toString().toLowerCase().includes(query.toLowerCase())
                    );

                // التصفية حسب اسم العميل
                const matchesCustomer = !filters.customer || 
                    (permission.customerName && permission.customerName.toLowerCase().includes(filters.customer.toLowerCase()));

                // التصفية حسب الشهر
                let matchesMonth = true;
                if (filters.month) {
                    matchesMonth = permission.permissionDate && permission.permissionDate.startsWith(filters.month);
                }

                // التصفية حسب التاريخ المحدد
                let matchesDate = true;
                if (filters.date) {
                    matchesDate = permission.permissionDate === filters.date;
                }

                return matchesSearch && matchesCustomer && matchesMonth && matchesDate;
            });
        } catch (error) {
            console.error('Error searching parts permissions:', error);
            return [];
        }
    }

    async getPartsPermissionByCaseNumber(caseNumber) {
        try {
            const { data, error } = await this.supabase
                .from('parts_permissions')
                .select('*')
                .eq('caseNumber', caseNumber);
            
            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (error) {
            console.error('Error getting parts permission by case number:', error);
            const permissions = this.loadFromStorage('partsPermissions') || [];
            return permissions.find(p => p.caseNumber === caseNumber) || null;
        }
    }

    // ========== المصروفات ==========

    async addExpense(expenseData) {
        try {
            const expense = {
                id: expenseData.id || this.generateId(),
                name: expenseData.name || '',
                reason: expenseData.reason || '',
                amount: expenseData.amount || 0,
                created_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('expenses')
                .insert([expense]);
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding expense:', error);
            const expenses = this.loadFromStorage('expenses') || [];
            expenses.push(expense);
            this.saveToStorage('expenses', expenses);
            return expense;
        }
    }

    async getAllExpenses() {
        try {
            const { data, error } = await this.supabase
                .from('expenses')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting expenses:', error);
            return this.loadFromStorage('expenses') || [];
        }
    }

    async deleteExpense(id) {
        try {
            const { error } = await this.supabase
                .from('expenses')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting expense:', error);
            const expenses = this.loadFromStorage('expenses') || [];
            const index = expenses.findIndex(e => e.id === id);
            if (index !== -1) {
                expenses.splice(index, 1);
                this.saveToStorage('expenses', expenses);
                return true;
            }
            return false;
        }
    }

    // ========== إدارة الفنيين ==========

    async addTechnician(technicianData) {
        try {
            const technician = {
                id: this.generateId(),
                name: technicianData.name || '',
                phone: technicianData.phone || '',
                specialty: technicianData.specialty || '',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            const { data, error } = await this.supabase
                .from('technicians')
                .insert([technician]);
            
            if (error) throw error;
            return data[0];
        } catch (error) {
            console.error('Error adding technician:', error);
            const technicians = this.loadFromStorage('technicians') || [];
            technicians.push(technician);
            this.saveToStorage('technicians', technicians);
            return technician;
        }
    }

    async getAllTechnicians() {
        try {
            const { data, error } = await this.supabase
                .from('technicians')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting technicians:', error);
            return this.loadFromStorage('technicians') || [];
        }
    }

    async deleteTechnician(id) {
        try {
            const { error } = await this.supabase
                .from('technicians')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error('Error deleting technician:', error);
            const technicians = this.loadFromStorage('technicians') || [];
            const index = technicians.findIndex(tech => tech.id === id);
            if (index !== -1) {
                technicians.splice(index, 1);
                this.saveToStorage('technicians', technicians);
                return true;
            }
            return false;
        }
    }

    async searchTechnicians(query) {
        try {
            const technicians = await this.getAllTechnicians();
            if (!query) return technicians;
            
            return technicians.filter(technician => 
                technician.name.toLowerCase().includes(query.toLowerCase()) ||
                (technician.phone && technician.phone.includes(query)) ||
                (technician.specialty && technician.specialty.toLowerCase().includes(query.toLowerCase()))
            );
        } catch (error) {
            console.error('Error searching technicians:', error);
            return [];
        }
    }

    // الحصول على إحصائيات الفني
    getTechnicianStats(technicianName) {
        const reports = this.loadFromStorage('reports') || [];
        
        const inspectionReports = reports.filter(report => 
            report.inspectionTech === technicianName
        );
        
        const repairReports = reports.filter(report => 
            report.repairTech === technicianName
        );
        
        const totalCollected = reports
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

    // ========== دوال إضافية ==========

    // إنشاء بيانات تجريبية
    createSampleData() {
        const sampleReports = [
            {
                id: 'sample1',
                caseNumber: '2024001',
                dateTime: '2024-01-15T10:00',
                customerName: 'محمد أحمد',
                customerAddress: 'حي النزهة - شارع الملك فهد',
                productType: 'تكييف',
                model: 'UA-123XYZ',
                warranty: 'ضمن الضمان',
                problemDescription: 'عدم تبريد',
                visitFee: '50',
                spareParts: 'كمبروسر',
                partsIssued: 'تم',
                inspectionTech: 'أحمد محمد',
                repairTech: 'محمود علي',
                repairFee: '200',
                note1: 'الجهاز يحتاج صيانة دورية',
                note2: 'تم الاتصال بالعميل',
                techFollowup: 'متابعة بعد أسبوع',
                totalFees: '250',
                repairDate: '2024-01-16',
                status: 'status-green',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'sample2',
                caseNumber: '2024002', 
                dateTime: '2024-01-16T14:30',
                customerName: 'فاطمة عبدالله',
                customerAddress: 'حي العليا - شارع التحلية',
                productType: 'غسالة',
                model: 'WM-456ABC',
                warranty: 'خارج الضمان',
                problemDescription: 'تسريب ماء',
                visitFee: '50',
                spareParts: 'خرطوم ماء',
                partsIssued: 'لم يتم',
                inspectionTech: 'محمود علي',
                repairTech: '',
                repairFee: '0',
                note1: 'في انتظار قطع الغيار',
                note2: '',
                techFollowup: 'الاتصال عند وصول القطعة',
                totalFees: '50',
                repairDate: '',
                status: 'status-blue',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        const sampleTechnicians = [
            {
                id: 'tech1',
                name: 'أحمد محمد',
                phone: '0123456789',
                specialty: 'تكييفات',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            },
            {
                id: 'tech2',
                name: 'محمود علي',
                phone: '0123456790', 
                specialty: 'غسالات',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            }
        ];

        // حفظ البيانات التجريبية
        this.saveToStorage('reports', sampleReports);
        this.saveToStorage('technicians', sampleTechnicians);
        this.saveToStorage('partsPermissions', []);
        this.saveToStorage('expenses', []);
        this.saveToStorage('deleted_reports', []);

        console.log('📊 تم إنشاء بيانات تجريبية');
    }

    // توليد معرف فريد
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // إنشاء نسخة احتياطية
    createBackup() {
        const backup = {
            reports: this.loadFromStorage('reports') || [],
            deleted_reports: this.loadFromStorage('deleted_reports') || [],
            parts_permissions: this.loadFromStorage('partsPermissions') || [],
            expenses: this.loadFromStorage('expenses') || [],
            technicians: this.loadFromStorage('technicians') || [],
            backupDate: new Date().toISOString(),
            version: '1.0'
        };
        
        return JSON.stringify(backup, null, 2);
    }

    // استعادة من نسخة احتياطية
    restoreFromBackup(backupData) {
        try {
            const backup = JSON.parse(backupData);
            
            if (backup.version && backup.reports) {
                this.saveToStorage('reports', backup.reports);
                this.saveToStorage('deleted_reports', backup.deleted_reports || []);
                this.saveToStorage('partsPermissions', backup.parts_permissions || []);
                this.saveToStorage('expenses', backup.expenses || []);
                this.saveToStorage('technicians', backup.technicians || []);
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error restoring from backup:', error);
            return false;
        }
    }
}

// إنشاء instance من قاعدة البيانات
const db = new Database();

// جعلها متاحة عالمياً للتصحيح
window.db = db;

export { db };