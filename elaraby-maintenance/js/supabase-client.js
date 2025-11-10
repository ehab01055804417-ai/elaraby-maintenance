// Supabase Client Configuration - Mock Version
// هذا ملف مؤقت حتى يتم إعداد Supabase الحقيقي

class SupabaseMock {
    constructor() {
        this.isConnected = true;
        this.tables = {
            'reports': [],
            'deleted_reports': [],
            'parts_permissions': [],
            'expenses': [],
            'technicians': []
        };
        this.init();
    }

    async init() {
        console.log('🔧 تهيئة نظام التخزين المحلي (سيتم الترقية إلى Supabase قريباً)');
        this.loadFromLocalStorage();
        this.isConnected = true;
    }

    loadFromLocalStorage() {
        Object.keys(this.tables).forEach(table => {
            const data = localStorage.getItem(table);
            if (data) {
                try {
                    this.tables[table] = JSON.parse(data);
                } catch (error) {
                    console.error(`Error loading ${table}:`, error);
                    this.tables[table] = [];
                }
            }
        });
    }

    saveToLocalStorage(table) {
        try {
            localStorage.setItem(table, JSON.stringify(this.tables[table]));
        } catch (error) {
            console.error(`Error saving ${table}:`, error);
        }
    }

    from(table) {
        return {
            select: (columns = '*') => this._select(table, columns),
            insert: (data) => this._insert(table, data),
            update: (data) => this._update(table, data),
            delete: () => this._delete(table),
            eq: (column, value) => this._eq(column, value),
            order: (column, options = { ascending: true }) => this._order(column, options)
        };
    }

    async _select(table, columns) {
        try {
            await this.delay(100); // محاكاة التأخير
            const data = this.tables[table] || [];
            return { data, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async _insert(table, data) {
        try {
            await this.delay(200); // محاكاة التأخير
            const newData = Array.isArray(data) ? data : [data];
            
            newData.forEach(item => {
                item.id = item.id || this.generateId();
                item.created_at = item.created_at || new Date().toISOString();
                item.updated_at = new Date().toISOString();
            });

            this.tables[table] = [...(this.tables[table] || []), ...newData];
            this.saveToLocalStorage(table);
            
            return { data: newData, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async _update(table, data) {
        try {
            await this.delay(150); // محاكاة التأخير
            if (!this.currentId) {
                return { data: null, error: new Error('No ID specified for update') };
            }

            const index = this.tables[table].findIndex(item => item.id === this.currentId);
            if (index === -1) {
                return { data: null, error: new Error('Item not found') };
            }

            this.tables[table][index] = {
                ...this.tables[table][index],
                ...data,
                updated_at: new Date().toISOString()
            };

            this.saveToLocalStorage(table);
            const updatedItem = this.tables[table][index];
            
            return { data: [updatedItem], error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    async _delete(table) {
        try {
            await this.delay(100); // محاكاة التأخير
            if (!this.currentId) {
                return { data: null, error: new Error('No ID specified for delete') };
            }

            this.tables[table] = this.tables[table].filter(item => item.id !== this.currentId);
            this.saveToLocalStorage(table);
            
            return { data: null, error: null };
        } catch (error) {
            return { data: null, error };
        }
    }

    _eq(column, value) {
        this.currentColumn = column;
        this.currentValue = value;
        
        // Filter the data for select operations
        if (this.tables[this.currentTable]) {
            this.tables[this.currentTable] = this.tables[this.currentTable].filter(
                item => item[column] === value
            );
        }
        
        return this;
    }

    _order(column, options = { ascending: true }) {
        if (this.tables[this.currentTable]) {
            this.tables[this.currentTable].sort((a, b) => {
                const aVal = a[column];
                const bVal = b[column];
                
                if (options.ascending) {
                    return aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
                } else {
                    return aVal > bVal ? -1 : aVal < bVal ? 1 : 0;
                }
            });
        }
        return this;
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // دالة لتفريغ جميع البيانات (للتطوير)
    clearAllData() {
        Object.keys(this.tables).forEach(table => {
            this.tables[table] = [];
            localStorage.removeItem(table);
        });
        console.log('🧹 تم تفريغ جميع البيانات');
    }

    // دالة لإنشاء بيانات تجريبية
    createSampleData() {
        // بيانات تجريبية للفنيين
        this.tables.technicians = [
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

        // حفظ في localStorage
        Object.keys(this.tables).forEach(table => {
            this.saveToLocalStorage(table);
        });

        console.log('📊 تم إنشاء بيانات تجريبية');
    }
}

// إنشاء instance من الـ mock
const supabase = new SupabaseMock();

// جعلها متاحة عالمياً للتصحيح
window.supabase = supabase;

// تصدير الـ mock كبديل مؤقت
export { supabase };