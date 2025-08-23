const logger = require('../utils/logger');
const fs = require('fs').promises;
const path = require('path');

class I18nService {
  constructor() {
    this.defaultLanguage = 'en';
    this.supportedLanguages = [
      { code: 'en', name: 'English', flag: '🇺🇸', rtl: false },
      { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
      { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
      { code: 'de', name: 'Deutsch', flag: '🇩🇪', rtl: false },
      { code: 'zh', name: '中文', flag: '🇨🇳', rtl: false }
    ];

    this.translations = {};
    this.isInitialized = false;
    this.cache = new Map();
    this.cacheTTL = 3600000; // 1 hour cache
  }

  /**
   * Initialize the service and load translations
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Load core translations
      await this.loadCoreTranslations();
      
      // Try to load external translation files if they exist
      await this.loadExternalTranslations();
      
      this.isInitialized = true;
      logger.info('I18n Service initialized successfully', {
        languages: this.supportedLanguages.length,
        defaultLanguage: this.defaultLanguage
      });
    } catch (error) {
      logger.error('Failed to initialize I18n Service:', error);
      // Continue with core translations only
      this.isInitialized = true;
    }
  }

  /**
   * Load core translations (built-in)
   */
  async loadCoreTranslations() {
    this.translations = {
      en: this.getEnglishTranslations(),
      es: this.getSpanishTranslations(),
      fr: this.getFrenchTranslations(),
      de: this.getGermanTranslations(),
      zh: this.getChineseTranslations()
    };
  }

  /**
   * Load external translation files from disk
   */
  async loadExternalTranslations() {
    try {
      const translationsDir = path.join(__dirname, '../../translations');
      
      // Check if translations directory exists
      try {
        await fs.access(translationsDir);
      } catch {
        // Directory doesn't exist, skip external loading
        return;
      }

      const files = await fs.readdir(translationsDir);
      const jsonFiles = files.filter(file => file.endsWith('.json'));

      for (const file of jsonFiles) {
        try {
          const filePath = path.join(translationsDir, file);
          const content = await fs.readFile(filePath, 'utf8');
          const translations = JSON.parse(content);
          
          // Extract language code from filename (e.g., "fr.json" -> "fr")
          const langCode = path.basename(file, '.json');
          
          if (this.isLanguageSupported(langCode)) {
            this.translations[langCode] = {
              ...this.translations[langCode],
              ...translations
            };
            logger.info(`Loaded external translations for ${langCode}`);
          }
        } catch (error) {
          logger.warn(`Failed to load external translations from ${file}:`, error.message);
        }
      }
    } catch (error) {
      logger.warn('Failed to load external translations:', error.message);
    }
  }

  /**
   * Get English translations
   */
  getEnglishTranslations() {
    return {
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
    };
  }

  /**
   * Get Spanish translations
   */
  getSpanishTranslations() {
    return {
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
    };
  }

  /**
   * Get French translations
   */
  getFrenchTranslations() {
    return {
      'auth.login_success': 'Connexion réussie',
      'auth.login_failed': 'Identifiants invalides',
      'auth.register_success': 'Inscription réussie',
      'auth.logout_success': 'Déconnexion réussie',
      'auth.password_reset_sent': 'Email de réinitialisation envoyé',
      'auth.password_reset_success': 'Réinitialisation du mot de passe réussie',
      'auth.email_verification_sent': 'Email de vérification envoyé',
      'auth.email_verification_success': 'Email vérifié avec succès',
      'auth.invalid_token': 'Token invalide ou expiré',
      'auth.unauthorized': 'Accès non autorisé',
      
      'blog.created': 'Blog créé avec succès',
      'blog.updated': 'Blog mis à jour avec succès',
      'blog.deleted': 'Blog supprimé avec succès',
      'blog.not_found': 'Blog introuvable',
      'blog.liked': 'Blog aimé avec succès',
      'blog.unliked': 'Blog désaimé avec succès',
      'blog.bookmarked': 'Blog ajouté aux favoris avec succès',
      'blog.unbookmarked': 'Blog retiré des favoris avec succès',
      
      'badge.earned': 'Badge obtenu !',
      'badge.eligible': 'Vous êtes éligible pour ce badge',
      'badge.claimed': 'Badge réclamé avec succès',
      'badge.not_eligible': 'Vous n\'êtes pas éligible pour ce badge',
      'badge.already_earned': 'Vous avez déjà obtenu ce badge',
      
      'notification.new_follower': 'Nouveau follower',
      'notification.new_like': 'Nouveau like sur votre blog',
      'notification.new_comment': 'Nouveau commentaire sur votre blog',
      'notification.level_up': 'Niveau supérieur !',
      'notification.badge_earned': 'Badge obtenu !',
      
      'error.validation_failed': 'Échec de la validation',
      'error.server_error': 'Erreur interne du serveur',
      'error.not_found': 'Ressource introuvable',
      'error.forbidden': 'Accès interdit',
      'error.rate_limit': 'Trop de requêtes',
      'error.invalid_input': 'Données d\'entrée invalides',
      
      'success.operation_completed': 'Opération terminée avec succès',
      'success.data_saved': 'Données sauvegardées avec succès',
      'success.data_updated': 'Données mises à jour avec succès',
      'success.data_deleted': 'Données supprimées avec succès',
      
      'ui.loading': 'Chargement...',
      'ui.saving': 'Sauvegarde...',
      'ui.deleting': 'Suppression...',
      'ui.confirm_delete': 'Êtes-vous sûr de vouloir supprimer ceci ?',
      'ui.yes': 'Oui',
      'ui.no': 'Non',
      'ui.cancel': 'Annuler',
      'ui.save': 'Sauvegarder',
      'ui.edit': 'Modifier',
      'ui.delete': 'Supprimer',
      'ui.submit': 'Soumettre',
      'ui.back': 'Retour',
      'ui.next': 'Suivant',
      'ui.previous': 'Précédent',
      
      'form.email': 'Email',
      'form.password': 'Mot de passe',
      'form.confirm_password': 'Confirmer le mot de passe',
      'form.name': 'Nom',
      'form.title': 'Titre',
      'form.content': 'Contenu',
      'form.description': 'Description',
      'form.tags': 'Tags',
      'form.category': 'Catégorie',
      'form.language': 'Langue',
      
      'validation.required': 'Ce champ est requis',
      'validation.email': 'Veuillez entrer une adresse email valide',
      'validation.min_length': 'La longueur minimale est de {min} caractères',
      'validation.max_length': 'La longueur maximale est de {max} caractères',
      'validation.password_match': 'Les mots de passe ne correspondent pas',
      'validation.unique': 'Cette valeur existe déjà',
      
      'time.just_now': 'À l\'instant',
      'time.minutes_ago': 'Il y a {minutes} minutes',
      'time.hours_ago': 'Il y a {hours} heures',
      'time.days_ago': 'Il y a {days} jours',
      'time.weeks_ago': 'Il y a {weeks} semaines',
      'time.months_ago': 'Il y a {months} mois',
      'time.years_ago': 'Il y a {years} ans'
    };
  }

  /**
   * Get German translations
   */
  getGermanTranslations() {
    return {
      'auth.login_success': 'Anmeldung erfolgreich',
      'auth.login_failed': 'Ungültige Anmeldedaten',
      'auth.register_success': 'Registrierung erfolgreich',
      'auth.logout_success': 'Abmeldung erfolgreich',
      'auth.password_reset_sent': 'Passwort-Reset-E-Mail gesendet',
      'auth.password_reset_success': 'Passwort-Reset erfolgreich',
      'auth.email_verification_sent': 'Verifizierungs-E-Mail gesendet',
      'auth.email_verification_success': 'E-Mail erfolgreich verifiziert',
      'auth.invalid_token': 'Ungültiger oder abgelaufener Token',
      'auth.unauthorized': 'Nicht autorisierter Zugriff',
      
      'blog.created': 'Blog erfolgreich erstellt',
      'blog.updated': 'Blog erfolgreich aktualisiert',
      'blog.deleted': 'Blog erfolgreich gelöscht',
      'blog.not_found': 'Blog nicht gefunden',
      'blog.liked': 'Blog erfolgreich geliked',
      'blog.unliked': 'Blog erfolgreich ungeliked',
      'blog.bookmarked': 'Blog erfolgreich zu Lesezeichen hinzugefügt',
      'blog.unbookmarked': 'Blog erfolgreich aus Lesezeichen entfernt',
      
      'badge.earned': 'Badge verdient!',
      'badge.eligible': 'Sie sind für diesen Badge berechtigt',
      'badge.claimed': 'Badge erfolgreich beansprucht',
      'badge.not_eligible': 'Sie sind nicht für diesen Badge berechtigt',
      'badge.already_earned': 'Sie haben diesen Badge bereits verdient',
      
      'notification.new_follower': 'Neuer Follower',
      'notification.new_like': 'Neuer Like auf Ihrem Blog',
      'notification.new_comment': 'Neuer Kommentar auf Ihrem Blog',
      'notification.level_up': 'Level aufgestiegen!',
      'notification.badge_earned': 'Badge verdient!',
      
      'error.validation_failed': 'Validierung fehlgeschlagen',
      'error.server_error': 'Interner Serverfehler',
      'error.not_found': 'Ressource nicht gefunden',
      'error.forbidden': 'Zugriff verboten',
      'error.rate_limit': 'Zu viele Anfragen',
      'error.invalid_input': 'Ungültige Eingabedaten',
      
      'success.operation_completed': 'Operation erfolgreich abgeschlossen',
      'success.data_saved': 'Daten erfolgreich gespeichert',
      'success.data_updated': 'Daten erfolgreich aktualisiert',
      'success.data_deleted': 'Daten erfolgreich gelöscht',
      
      'ui.loading': 'Lädt...',
      'ui.saving': 'Speichert...',
      'ui.deleting': 'Löscht...',
      'ui.confirm_delete': 'Sind Sie sicher, dass Sie dies löschen möchten?',
      'ui.yes': 'Ja',
      'ui.no': 'Nein',
      'ui.cancel': 'Abbrechen',
      'ui.save': 'Speichern',
      'ui.edit': 'Bearbeiten',
      'ui.delete': 'Löschen',
      'ui.submit': 'Absenden',
      'ui.back': 'Zurück',
      'ui.next': 'Weiter',
      'ui.previous': 'Zurück',
      
      'form.email': 'E-Mail',
      'form.password': 'Passwort',
      'form.confirm_password': 'Passwort bestätigen',
      'form.name': 'Name',
      'form.title': 'Titel',
      'form.content': 'Inhalt',
      'form.description': 'Beschreibung',
      'form.tags': 'Tags',
      'form.category': 'Kategorie',
      'form.language': 'Sprache',
      
      'validation.required': 'Dieses Feld ist erforderlich',
      'validation.email': 'Bitte geben Sie eine gültige E-Mail-Adresse ein',
      'validation.min_length': 'Mindestlänge ist {min} Zeichen',
      'validation.max_length': 'Maximallänge ist {max} Zeichen',
      'validation.password_match': 'Passwörter stimmen nicht überein',
      'validation.unique': 'Dieser Wert existiert bereits',
      
      'time.just_now': 'Gerade eben',
      'time.minutes_ago': 'vor {minutes} Minuten',
      'time.hours_ago': 'vor {hours} Stunden',
      'time.days_ago': 'vor {days} Tagen',
      'time.weeks_ago': 'vor {weeks} Wochen',
      'time.months_ago': 'vor {months} Monaten',
      'time.years_ago': 'vor {years} Jahren'
    };
  }

  /**
   * Get Chinese translations
   */
  getChineseTranslations() {
    return {
      'auth.login_success': '登录成功',
      'auth.login_failed': '凭据无效',
      'auth.register_success': '注册成功',
      'auth.logout_success': '登出成功',
      'auth.password_reset_sent': '密码重置邮件已发送',
      'auth.password_reset_success': '密码重置成功',
      'auth.email_verification_sent': '验证邮件已发送',
      'auth.email_verification_success': '邮件验证成功',
      'auth.invalid_token': '令牌无效或已过期',
      'auth.unauthorized': '未授权访问',
      
      'blog.created': '博客创建成功',
      'blog.updated': '博客更新成功',
      'blog.deleted': '博客删除成功',
      'blog.not_found': '博客未找到',
      'blog.liked': '博客点赞成功',
      'blog.unliked': '博客取消点赞成功',
      'blog.bookmarked': '博客收藏成功',
      'blog.unbookmarked': '博客取消收藏成功',
      
      'badge.earned': '获得徽章！',
      'badge.eligible': '您有资格获得此徽章',
      'badge.claimed': '徽章认领成功',
      'badge.not_eligible': '您没有资格获得此徽章',
      'badge.already_earned': '您已经获得此徽章',
      
      'notification.new_follower': '新关注者',
      'notification.new_like': '您的博客收到新点赞',
      'notification.new_comment': '您的博客收到新评论',
      'notification.level_up': '升级！',
      'notification.badge_earned': '获得徽章！',
      
      'error.validation_failed': '验证失败',
      'error.server_error': '内部服务器错误',
      'error.not_found': '资源未找到',
      'error.forbidden': '访问被禁止',
      'error.rate_limit': '请求过多',
      'error.invalid_input': '输入数据无效',
      
      'success.operation_completed': '操作成功完成',
      'success.data_saved': '数据保存成功',
      'success.data_updated': '数据更新成功',
      'success.data_deleted': '数据删除成功',
      
      'ui.loading': '加载中...',
      'ui.saving': '保存中...',
      'ui.deleting': '删除中...',
      'ui.confirm_delete': '您确定要删除这个吗？',
      'ui.yes': '是',
      'ui.no': '否',
      'ui.cancel': '取消',
      'ui.save': '保存',
      'ui.edit': '编辑',
      'ui.delete': '删除',
      'ui.submit': '提交',
      'ui.back': '返回',
      'ui.next': '下一步',
      'ui.previous': '上一步',
      
      'form.email': '邮箱',
      'form.password': '密码',
      'form.confirm_password': '确认密码',
      'form.name': '姓名',
      'form.title': '标题',
      'form.content': '内容',
      'form.description': '描述',
      'form.tags': '标签',
      'form.category': '分类',
      'form.language': '语言',
      
      'validation.required': '此字段为必填项',
      'validation.email': '请输入有效的邮箱地址',
      'validation.min_length': '最小长度为 {min} 个字符',
      'validation.max_length': '最大长度为 {max} 个字符',
      'validation.password_match': '密码不匹配',
      'validation.unique': '此值已存在',
      
      'time.just_now': '刚刚',
      'time.minutes_ago': '{minutes} 分钟前',
      'time.hours_ago': '{hours} 小时前',
      'time.days_ago': '{days} 天前',
      'time.weeks_ago': '{weeks} 周前',
      'time.months_ago': '{months} 个月前',
      'time.years_ago': '{years} 年前'
    };
  }

  /**
   * Get translation for a key with caching
   */
  translate(key, language = 'en', params = {}) {
    try {
      // Check cache first
      const cacheKey = `${language}:${key}:${JSON.stringify(params)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.cacheTTL) {
        return cached.value;
      }

      const lang = this.supportedLanguages.find(l => l.code === language) ? language : this.defaultLanguage;
      let translation = this.translations[lang]?.[key] || this.translations[this.defaultLanguage]?.[key] || key;
      
      // Replace parameters
      Object.keys(params).forEach(param => {
        translation = translation.replace(new RegExp(`{${param}}`, 'g'), params[param]);
      });
      
      // Cache the result
      this.cache.set(cacheKey, {
        value: translation,
        timestamp: Date.now()
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
      logger.info(`Default language changed to: ${language}`);
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
    
    // Clear cache for this language
    this.clearCacheForLanguage(language);
    
    logger.info(`Added translation: ${language}:${key}`);
  }

  /**
   * Add new language
   */
  addLanguage(code, name, flag, rtl = false) {
    if (!this.isLanguageSupported(code)) {
      this.supportedLanguages.push({ code, name, flag, rtl });
      this.translations[code] = {};
      logger.info(`Added new language: ${code} (${name})`);
    }
  }

  /**
   * Remove language
   */
  removeLanguage(code) {
    if (code === this.defaultLanguage) {
      logger.warn(`Cannot remove default language: ${code}`);
      return false;
    }
    
    const index = this.supportedLanguages.findIndex(l => l.code === code);
    if (index !== -1) {
      this.supportedLanguages.splice(index, 1);
      delete this.translations[code];
      this.clearCacheForLanguage(code);
      logger.info(`Removed language: ${code}`);
      return true;
    }
    return false;
  }

  /**
   * Clear cache for specific language
   */
  clearCacheForLanguage(language) {
    for (const [key] of this.cache) {
      if (key.startsWith(`${language}:`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear entire cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Translation cache cleared');
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

  /**
   * Get language direction (LTR/RTL)
   */
  getLanguageDirection(language) {
    const lang = this.supportedLanguages.find(l => l.code === language);
    return lang ? lang.rtl : false;
  }

  /**
   * Export translations for a language
   */
  exportTranslations(language) {
    try {
      const translations = this.getTranslations(language);
      return JSON.stringify(translations, null, 2);
    } catch (error) {
      logger.error(`Failed to export translations for ${language}:`, error);
      return null;
    }
  }

  /**
   * Import translations for a language
   */
  importTranslations(language, translationsData) {
    try {
      const translations = typeof translationsData === 'string' 
        ? JSON.parse(translationsData) 
        : translationsData;
      
      if (this.isLanguageSupported(language)) {
        this.translations[language] = {
          ...this.translations[language],
          ...translations
        };
        
        // Clear cache for this language
        this.clearCacheForLanguage(language);
        
        logger.info(`Imported translations for ${language}`);
        return true;
      }
      return false;
    } catch (error) {
      logger.error(`Failed to import translations for ${language}:`, error);
      return false;
    }
  }

  /**
   * Get translation statistics
   */
  getTranslationStats() {
    const stats = {};
    
    for (const lang of this.supportedLanguages) {
      const translations = this.translations[lang.code] || {};
      stats[lang.code] = {
        name: lang.name,
        totalKeys: Object.keys(translations).length,
        coverage: this.calculateCoverage(translations)
      };
    }
    
    return stats;
  }

  /**
   * Calculate translation coverage
   */
  calculateCoverage(translations) {
    const totalKeys = Object.keys(this.translations[this.defaultLanguage] || {}).length;
    if (totalKeys === 0) return 0;
    
    const translatedKeys = Object.keys(translations).length;
    return Math.round((translatedKeys / totalKeys) * 100);
  }
}

// Singleton instance
const i18nService = new I18nService();

module.exports = i18nService; 