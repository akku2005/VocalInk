const logger = require('../utils/logger');

class I18nService {
  constructor() {
    this.defaultLanguage = 'en';
    this.supportedLanguages = [
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
      { code: 'fr', name: 'Français', flag: '🇫🇷' },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'it', name: 'Italiano', flag: '🇮🇹' },
      { code: 'pt', name: 'Português', flag: '🇵🇹' },
      { code: 'ru', name: 'Русский', flag: '🇷🇺' },
      { code: 'ja', name: '日本語', flag: '🇯🇵' },
      { code: 'ko', name: '한국어', flag: '🇰🇷' },
      { code: 'zh', name: '中文', flag: '🇨🇳' },
      { code: 'ar', name: 'العربية', flag: '🇸🇦' },
      { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' }
    ];

    this.translations = {
      en: {
        // Auth messages
        'auth.login_success': 'Login successful',
        'auth.login_failed': 'Invalid credentials',
        'auth.register_success': 'Registration successful',
        'auth.logout_success': 'Logout successful',
        'auth.password_reset_sent': 'Password reset email sent',
        'auth.password_reset_success': 'Password reset successful',
        'auth.email_verification_sent': 'Verification email sent',
        'auth.email_verification_success': 'Email verified successfully',
        'auth.invalid_token': 'Invalid or expired token',
        'auth.unauthorized': 'Unauthorized access',
        
        // Blog messages
        'blog.created': 'Blog created successfully',
        'blog.updated': 'Blog updated successfully',
        'blog.deleted': 'Blog deleted successfully',
        'blog.not_found': 'Blog not found',
        'blog.liked': 'Blog liked successfully',
        'blog.unliked': 'Blog unliked successfully',
        'blog.bookmarked': 'Blog bookmarked successfully',
        'blog.unbookmarked': 'Blog unbookmarked successfully',
        
        // Badge messages
        'badge.earned': 'Badge earned!',
        'badge.eligible': 'You are eligible for this badge',
        'badge.claimed': 'Badge claimed successfully',
        'badge.not_eligible': 'You are not eligible for this badge',
        'badge.already_earned': 'You have already earned this badge',
        
        // Notification messages
        'notification.new_follower': 'New follower',
        'notification.new_like': 'New like on your blog',
        'notification.new_comment': 'New comment on your blog',
        'notification.level_up': 'Level up!',
        'notification.badge_earned': 'Badge earned!',
        
        // Error messages
        'error.validation_failed': 'Validation failed',
        'error.server_error': 'Internal server error',
        'error.not_found': 'Resource not found',
        'error.forbidden': 'Access forbidden',
        'error.rate_limit': 'Too many requests',
        'error.invalid_input': 'Invalid input data',
        
        // Success messages
        'success.operation_completed': 'Operation completed successfully',
        'success.data_saved': 'Data saved successfully',
        'success.data_updated': 'Data updated successfully',
        'success.data_deleted': 'Data deleted successfully',
        
        // UI messages
        'ui.loading': 'Loading...',
        'ui.saving': 'Saving...',
        'ui.deleting': 'Deleting...',
        'ui.confirm_delete': 'Are you sure you want to delete this?',
        'ui.yes': 'Yes',
        'ui.no': 'No',
        'ui.cancel': 'Cancel',
        'ui.save': 'Save',
        'ui.edit': 'Edit',
        'ui.delete': 'Delete',
        'ui.submit': 'Submit',
        'ui.back': 'Back',
        'ui.next': 'Next',
        'ui.previous': 'Previous',
        
        // Form labels
        'form.email': 'Email',
        'form.password': 'Password',
        'form.confirm_password': 'Confirm Password',
        'form.name': 'Name',
        'form.title': 'Title',
        'form.content': 'Content',
        'form.description': 'Description',
        'form.tags': 'Tags',
        'form.category': 'Category',
        'form.language': 'Language',
        
        // Validation messages
        'validation.required': 'This field is required',
        'validation.email': 'Please enter a valid email address',
        'validation.min_length': 'Minimum length is {min} characters',
        'validation.max_length': 'Maximum length is {max} characters',
        'validation.password_match': 'Passwords do not match',
        'validation.unique': 'This value already exists',
        
        // Time formats
        'time.just_now': 'Just now',
        'time.minutes_ago': '{minutes} minutes ago',
        'time.hours_ago': '{hours} hours ago',
        'time.days_ago': '{days} days ago',
        'time.weeks_ago': '{weeks} weeks ago',
        'time.months_ago': '{months} months ago',
        'time.years_ago': '{years} years ago'
      },
      
      es: {
        'auth.login_success': 'Inicio de sesión exitoso',
        'auth.login_failed': 'Credenciales inválidas',
        'auth.register_success': 'Registro exitoso',
        'auth.logout_success': 'Cierre de sesión exitoso',
        'auth.password_reset_sent': 'Email de restablecimiento de contraseña enviado',
        'auth.password_reset_success': 'Restablecimiento de contraseña exitoso',
        'auth.email_verification_sent': 'Email de verificación enviado',
        'auth.email_verification_success': 'Email verificado exitosamente',
        'auth.invalid_token': 'Token inválido o expirado',
        'auth.unauthorized': 'Acceso no autorizado',
        
        'blog.created': 'Blog creado exitosamente',
        'blog.updated': 'Blog actualizado exitosamente',
        'blog.deleted': 'Blog eliminado exitosamente',
        'blog.not_found': 'Blog no encontrado',
        'blog.liked': 'Blog marcado como me gusta exitosamente',
        'blog.unliked': 'Blog desmarcado como me gusta exitosamente',
        'blog.bookmarked': 'Blog guardado exitosamente',
        'blog.unbookmarked': 'Blog eliminado de guardados exitosamente',
        
        'badge.earned': '¡Insignia obtenida!',
        'badge.eligible': 'Eres elegible para esta insignia',
        'badge.claimed': 'Insignia reclamada exitosamente',
        'badge.not_eligible': 'No eres elegible para esta insignia',
        'badge.already_earned': 'Ya has obtenido esta insignia',
        
        'notification.new_follower': 'Nuevo seguidor',
        'notification.new_like': 'Nuevo me gusta en tu blog',
        'notification.new_comment': 'Nuevo comentario en tu blog',
        'notification.level_up': '¡Subida de nivel!',
        'notification.badge_earned': '¡Insignia obtenida!',
        
        'error.validation_failed': 'Validación fallida',
        'error.server_error': 'Error interno del servidor',
        'error.not_found': 'Recurso no encontrado',
        'error.forbidden': 'Acceso prohibido',
        'error.rate_limit': 'Demasiadas solicitudes',
        'error.invalid_input': 'Datos de entrada inválidos',
        
        'success.operation_completed': 'Operación completada exitosamente',
        'success.data_saved': 'Datos guardados exitosamente',
        'success.data_updated': 'Datos actualizados exitosamente',
        'success.data_deleted': 'Datos eliminados exitosamente',
        
        'ui.loading': 'Cargando...',
        'ui.saving': 'Guardando...',
        'ui.deleting': 'Eliminando...',
        'ui.confirm_delete': '¿Estás seguro de que quieres eliminar esto?',
        'ui.yes': 'Sí',
        'ui.no': 'No',
        'ui.cancel': 'Cancelar',
        'ui.save': 'Guardar',
        'ui.edit': 'Editar',
        'ui.delete': 'Eliminar',
        'ui.submit': 'Enviar',
        'ui.back': 'Atrás',
        'ui.next': 'Siguiente',
        'ui.previous': 'Anterior',
        
        'form.email': 'Correo electrónico',
        'form.password': 'Contraseña',
        'form.confirm_password': 'Confirmar contraseña',
        'form.name': 'Nombre',
        'form.title': 'Título',
        'form.content': 'Contenido',
        'form.description': 'Descripción',
        'form.tags': 'Etiquetas',
        'form.category': 'Categoría',
        'form.language': 'Idioma',
        
        'validation.required': 'Este campo es requerido',
        'validation.email': 'Por favor ingresa una dirección de correo válida',
        'validation.min_length': 'La longitud mínima es {min} caracteres',
        'validation.max_length': 'La longitud máxima es {max} caracteres',
        'validation.password_match': 'Las contraseñas no coinciden',
        'validation.unique': 'Este valor ya existe',
        
        'time.just_now': 'Ahora mismo',
        'time.minutes_ago': 'Hace {minutes} minutos',
        'time.hours_ago': 'Hace {hours} horas',
        'time.days_ago': 'Hace {days} días',
        'time.weeks_ago': 'Hace {weeks} semanas',
        'time.months_ago': 'Hace {months} meses',
        'time.years_ago': 'Hace {years} años'
      }
    };
  }

  /**
   * Get translation for a key
   */
  translate(key, language = 'en', params = {}) {
    try {
      const lang = this.supportedLanguages.find(l => l.code === language) ? language : this.defaultLanguage;
      let translation = this.translations[lang]?.[key] || this.translations[this.defaultLanguage]?.[key] || key;
      
      // Replace parameters
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), params[param]);
      });
      
      return translation;
    } catch (error) {
      logger.error('Translation error:', error);
      return key;
    }
  }

  /**
   * Get all translations for a language
   */
  getTranslations(language = 'en') {
    const lang = this.supportedLanguages.find(l => l.code === language) ? language : this.defaultLanguage;
    return this.translations[lang] || this.translations[this.defaultLanguage];
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(language) {
    return this.supportedLanguages.some(l => l.code === language);
  }

  /**
   * Get default language
   */
  getDefaultLanguage() {
    return this.defaultLanguage;
  }

  /**
   * Set default language
   */
  setDefaultLanguage(language) {
    if (this.isLanguageSupported(language)) {
      this.defaultLanguage = language;
    }
  }

  /**
   * Add new translation
   */
  addTranslation(language, key, value) {
    if (!this.translations[language]) {
      this.translations[language] = {};
    }
    this.translations[language][key] = value;
  }

  /**
   * Add new language
   */
  addLanguage(code, name, flag) {
    if (!this.isLanguageSupported(code)) {
      this.supportedLanguages.push({ code, name, flag });
    }
  }

  /**
   * Format date according to language
   */
  formatDate(date, language = 'en') {
    try {
      const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      
      return new Intl.DateTimeFormat(language, options).format(new Date(date));
    } catch (error) {
      logger.error('Date formatting error:', error);
      return date;
    }
  }

  /**
   * Format number according to language
   */
  formatNumber(number, language = 'en') {
    try {
      return new Intl.NumberFormat(language).format(number);
    } catch (error) {
      logger.error('Number formatting error:', error);
      return number;
    }
  }

  /**
   * Get language from request headers
   */
  getLanguageFromRequest(req) {
    const acceptLanguage = req.headers['accept-language'];
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => {
        const [code] = lang.trim().split(';');
        return code.toLowerCase();
      });
      
      for (const lang of languages) {
        if (this.isLanguageSupported(lang)) {
          return lang;
        }
      }
    }
    
    return this.defaultLanguage;
  }

  /**
   * Middleware to set language
   */
  middleware() {
    return (req, res, next) => {
      req.language = this.getLanguageFromRequest(req);
      req.t = (key, params = {}) => this.translate(key, req.language, params);
      next();
    };
  }
}

// Singleton instance
const i18nService = new I18nService();

module.exports = i18nService; 