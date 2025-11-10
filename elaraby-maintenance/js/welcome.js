// تطبيق الصفحة الترحيبية
class WelcomeApp {
    constructor() {
        this.progress = 0;
        this.progressInterval = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startLoadingProgress();
    }

    // إعداد مستمعي الأحداث
    setupEventListeners() {
        // نموذج تسجيل الدخول
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // إدخال البيانات تلقائياً في الحقول
        document.addEventListener('DOMContentLoaded', () => {
            document.getElementById('username').value = 'المناشي';
            document.getElementById('password').value = '66227511';
        });
    }

    // بدء شريط التحميل
    startLoadingProgress() {
        this.progressInterval = setInterval(() => {
            this.progress += Math.random() * 15;
            if (this.progress > 100) {
                this.progress = 100;
                clearInterval(this.progressInterval);
                setTimeout(() => {
                    this.completeLoading();
                }, 500);
            }
            this.updateProgressBar();
        }, 300);
    }

    // تحديث شريط التحميل
    updateProgressBar() {
        const progressFill = document.getElementById('progressFill');
        const progressPercent = document.getElementById('progressPercent');
        
        progressFill.style.width = `${this.progress}%`;
        progressPercent.textContent = `${Math.round(this.progress)}%`;
    }

    // إكمال التحميل والانتقال لشاشة الدخول
    completeLoading() {
        const loadingScreen = document.getElementById('loadingScreen');
        const loginScreen = document.getElementById('loginScreen');
        
        // إخفاء شاشة التحميل
        loadingScreen.style.opacity = '0';
        loadingScreen.style.visibility = 'hidden';
        
        // إظهار شاشة تسجيل الدخول
        setTimeout(() => {
            loginScreen.classList.add('active');
        }, 800);
        
        this.showToast('مرحباً بك في نظام إدارة البلاغات');
    }

    // معالجة تسجيل الدخول
    async handleLogin() {
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const loginBtn = document.getElementById('loginBtn');
        
        // التحقق من صحة البيانات
        if (username !== 'المناشي' || password !== '66227511') {
            this.showToast('اسم المستخدم أو كلمة المرور غير صحيحة', 'error');
            
            // إضافة أنيميشن للحقول
            document.getElementById('username').classList.add('error');
            document.getElementById('password').classList.add('error');
            
            setTimeout(() => {
                document.getElementById('username').classList.remove('error');
                document.getElementById('password').classList.remove('error');
            }, 1000);
            
            return;
        }
        
        // إضافة تأثير تحميل للزر
        const originalText = loginBtn.innerHTML;
        loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تسجيل الدخول...';
        loginBtn.disabled = true;
        
        // محاكاة التأخير للحصول على تجربة أفضل
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // تسجيل الدخول الناجح
        this.showToast('تم تسجيل الدخول بنجاح!');
        
        // الانتقال إلى التطبيق الرئيسي
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
        
        // استعادة حالة الزر
        setTimeout(() => {
            loginBtn.innerHTML = originalText;
            loginBtn.disabled = false;
        }, 2000);
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

// تهيئة التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    new WelcomeApp();
});