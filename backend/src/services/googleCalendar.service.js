const { google } = require('googleapis');

/**
 * Google Calendar API istemcisi oluştur
 */
const createCalendarClient = (accessToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: accessToken
  });

  return google.calendar({ version: 'v3', auth: oauth2Client });
};

/**
 * Etkinliği Google Calendar'a ekle
 */
exports.createEvent = async (event, accessToken) => {
  const calendar = createCalendarClient(accessToken);
  
  // Katılımcıları Google formatına dönüştür
  const attendees = event.attendees ? event.attendees.map(attendee => ({
    email: attendee.email,
    displayName: attendee.name,
    responseStatus: 'needsAction'
  })) : [];

  // Google Calendar etkinlik nesnesini oluştur
  const googleEvent = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.startDate.toISOString(),
      timeZone: 'Europe/Istanbul', // Ülkeye göre ayarlanabilir
    },
    end: {
      dateTime: event.endDate.toISOString(),
      timeZone: 'Europe/Istanbul',
    },
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 1 gün önce
        { method: 'popup', minutes: 30 }, // 30 dakika önce
      ],
    },
    colorId: mapColorToGoogleColorId(event.color),
    status: mapStatusToGoogleStatus(event.status)
  };

  // Etkinliği oluştur
  const response = await calendar.events.insert({
    calendarId: 'primary', // 'primary' = kullanıcının ana takvimi
    resource: googleEvent,
    sendUpdates: 'all', // Katılımcılara e-posta gönder
  });

  return response.data;
};

/**
 * Google Calendar'daki etkinliği güncelle
 */
exports.updateEvent = async (event, accessToken) => {
  if (!event.googleCalendarId) {
    throw new Error('Google Calendar ID bulunamadı');
  }

  const calendar = createCalendarClient(accessToken);
  
  // Katılımcıları Google formatına dönüştür
  const attendees = event.attendees ? event.attendees.map(attendee => ({
    email: attendee.email,
    displayName: attendee.name,
    responseStatus: mapAttendeeStatusToGoogleStatus(attendee.status)
  })) : [];

  // Google Calendar etkinlik nesnesini oluştur
  const googleEvent = {
    summary: event.title,
    description: event.description || '',
    location: event.location || '',
    start: {
      dateTime: event.startDate.toISOString(),
      timeZone: 'Europe/Istanbul',
    },
    end: {
      dateTime: event.endDate.toISOString(),
      timeZone: 'Europe/Istanbul',
    },
    attendees,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },
        { method: 'popup', minutes: 30 },
      ],
    },
    colorId: mapColorToGoogleColorId(event.color),
    status: mapStatusToGoogleStatus(event.status)
  };

  // Etkinliği güncelle
  const response = await calendar.events.update({
    calendarId: 'primary',
    eventId: event.googleCalendarId,
    resource: googleEvent,
    sendUpdates: 'all', // Katılımcılara e-posta gönder
  });

  return response.data;
};

/**
 * Google Calendar'dan etkinliği sil
 */
exports.deleteEvent = async (googleCalendarId, accessToken) => {
  const calendar = createCalendarClient(accessToken);
  
  // Etkinliği sil
  const response = await calendar.events.delete({
    calendarId: 'primary',
    eventId: googleCalendarId,
    sendUpdates: 'all', // Katılımcılara e-posta gönder
  });

  return response.data;
};

/**
 * CRM renk kodunu Google Calendar renk ID'sine dönüştür
 */
const mapColorToGoogleColorId = (color) => {
  const colorMap = {
    '#3498db': '1', // Mavi
    '#e74c3c': '4', // Kırmızı
    '#2ecc71': '2', // Yeşil
    '#f39c12': '6', // Turuncu
    '#9b59b6': '3', // Mor
    '#1abc9c': '7', // Turkuaz
    '#34495e': '8', // Lacivert
    '#7f8c8d': '5'  // Gri
  };
  
  return colorMap[color] || '1'; // Varsayılan olarak mavi
};

/**
 * CRM etkinlik durumunu Google Calendar durumuna dönüştür
 */
const mapStatusToGoogleStatus = (status) => {
  const statusMap = {
    'planlanmis': 'confirmed',
    'tamamlandi': 'confirmed',
    'iptal_edildi': 'cancelled',
    'ertelendi': 'tentative'
  };
  
  return statusMap[status] || 'confirmed';
};

/**
 * CRM katılımcı durumunu Google Calendar durumuna dönüştür
 */
const mapAttendeeStatusToGoogleStatus = (status) => {
  const statusMap = {
    'davet_edildi': 'needsAction',
    'kabul_etti': 'accepted',
    'reddetti': 'declined',
    'belirsiz': 'tentative'
  };
  
  return statusMap[status] || 'needsAction';
};

/**
 * Google Calendar API'si için token yenileme
 * Not: Yenileme token'ı varsa token'ı yeniler
 */
exports.refreshToken = async (refreshToken) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  const { tokens } = await oauth2Client.refreshAccessToken();
  return tokens;
}; 