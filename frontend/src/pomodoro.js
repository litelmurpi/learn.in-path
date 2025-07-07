// pomodoro.js - Pomodoro Timer functionality

import { apiService } from './apiService.js';

class PomodoroTimer {
  constructor() {
    this.session = null;
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.isRunning = false;
    this.settings = null;
    
    this.bindEvents();
    this.loadSettings();
    this.loadActiveSession();
  }

  bindEvents() {
    // Start/Stop button
    document.addEventListener('click', (e) => {
      if (e.target.matches('#pomodoroStartBtn')) {
        this.handleStartStop();
      }
      if (e.target.matches('#pomodoroPauseBtn')) {
        this.pauseSession();
      }
      if (e.target.matches('#pomodoroResumeBtn')) {
        this.resumeSession();
      }
      if (e.target.matches('#pomodoroCompleteBtn')) {
        this.completeSession();
      }
      if (e.target.matches('#pomodoroCancelBtn')) {
        this.cancelSession();
      }
      if (e.target.matches('#pomodoroSettingsBtn')) {
        this.showSettings();
      }
    });

    // Session type selection
    document.addEventListener('change', (e) => {
      if (e.target.matches('#sessionType')) {
        this.updateDurationFromType(e.target.value);
      }
    });
  }

  async loadSettings() {
    try {
      const response = await apiService.get('/pomodoro/settings');
      if (response.success) {
        this.settings = response.data.settings;
        this.updateSettingsUI();
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Use default settings
      this.settings = {
        work_duration: 25,
        short_break_duration: 5,
        long_break_duration: 15,
        sessions_before_long_break: 4,
        auto_start_breaks: false,
        notifications_enabled: true
      };
    }
  }

  async loadActiveSession() {
    try {
      const response = await apiService.get('/pomodoro/active');
      if (response.success && response.data.session) {
        this.session = response.data.session;
        this.updateUIForActiveSession();
        this.startTimer();
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  }

  async handleStartStop() {
    if (this.session && (this.session.status === 'active' || this.session.status === 'paused')) {
      return; // Session already active, use pause/resume buttons
    }

    await this.startNewSession();
  }

  async startNewSession() {
    const sessionType = document.getElementById('sessionType')?.value || 'work';
    const plannedDuration = parseInt(document.getElementById('plannedDuration')?.value) || this.settings.work_duration;
    const notes = document.getElementById('sessionNotes')?.value || '';

    try {
      const response = await apiService.post('/pomodoro/start', {
        session_type: sessionType,
        planned_duration: plannedDuration,
        notes: notes
      });

      if (response.success) {
        this.session = response.data.session;
        this.timeRemaining = plannedDuration * 60; // Convert to seconds
        this.updateUIForActiveSession();
        this.startTimer();
        this.showNotification('Session started!', `${plannedDuration}-minute ${sessionType} session began.`);
      } else {
        this.showError(response.message);
      }
    } catch (error) {
      console.error('Error starting session:', error);
      this.showError('Failed to start session. Please try again.');
    }
  }

  async pauseSession() {
    if (!this.session) return;

    try {
      const response = await apiService.put(`/pomodoro/${this.session.id}/pause`);
      if (response.success) {
        this.session = response.data.session;
        this.stopTimer();
        this.updateUIForPausedSession();
        this.showNotification('Session paused', 'Your session has been paused.');
      }
    } catch (error) {
      console.error('Error pausing session:', error);
      this.showError('Failed to pause session.');
    }
  }

  async resumeSession() {
    if (!this.session) return;

    try {
      const response = await apiService.put(`/pomodoro/${this.session.id}/resume`);
      if (response.success) {
        this.session = response.data.session;
        this.startTimer();
        this.updateUIForActiveSession();
        this.showNotification('Session resumed', 'Your session has been resumed.');
      }
    } catch (error) {
      console.error('Error resuming session:', error);
      this.showError('Failed to resume session.');
    }
  }

  async completeSession() {
    if (!this.session) return;

    const notes = document.getElementById('sessionNotes')?.value || '';
    const createStudyLog = document.getElementById('createStudyLog')?.checked || false;
    const studyTopic = document.getElementById('studyTopic')?.value || '';

    try {
      const response = await apiService.put(`/pomodoro/${this.session.id}/complete`, {
        notes: notes,
        create_study_log: createStudyLog,
        study_topic: studyTopic
      });

      if (response.success) {
        this.stopTimer();
        this.resetSession();
        this.showNotification('Session completed!', 'Great job! Your session has been completed.');
        this.suggestBreak();
      }
    } catch (error) {
      console.error('Error completing session:', error);
      this.showError('Failed to complete session.');
    }
  }

  async cancelSession() {
    if (!this.session) return;

    try {
      const response = await apiService.put(`/pomodoro/${this.session.id}/cancel`);
      if (response.success) {
        this.stopTimer();
        this.resetSession();
        this.showNotification('Session cancelled', 'Your session has been cancelled.');
      }
    } catch (error) {
      console.error('Error cancelling session:', error);
      this.showError('Failed to cancel session.');
    }
  }

  startTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    this.isRunning = true;
    this.updateTimerDisplay();

    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
        this.updateTimerDisplay();
      } else {
        this.onTimerComplete();
      }
    }, 1000);
  }

  stopTimer() {
    this.isRunning = false;
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  onTimerComplete() {
    this.stopTimer();
    this.showNotification('Time\'s up!', 'Your pomodoro session is complete!');
    this.completeSession();
  }

  updateTimerDisplay() {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    
    const timerElement = document.getElementById('pomodoroTimer');
    if (timerElement) {
      timerElement.textContent = display;
    }

    // Update progress bar
    if (this.session) {
      const totalTime = this.session.planned_duration * 60;
      const elapsed = totalTime - this.timeRemaining;
      const progress = (elapsed / totalTime) * 100;
      
      const progressElement = document.getElementById('pomodoroProgress');
      if (progressElement) {
        progressElement.style.width = `${progress}%`;
      }
    }
  }

  updateUIForActiveSession() {
    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resumeBtn = document.getElementById('pomodoroResumeBtn');
    const completeBtn = document.getElementById('pomodoroCompleteBtn');
    const cancelBtn = document.getElementById('pomodoroCancelBtn');

    if (startBtn) startBtn.style.display = 'none';
    if (pauseBtn) pauseBtn.style.display = 'inline-block';
    if (resumeBtn) resumeBtn.style.display = 'none';
    if (completeBtn) completeBtn.style.display = 'inline-block';
    if (cancelBtn) cancelBtn.style.display = 'inline-block';

    // Update session info
    if (this.session) {
      const sessionTypeElement = document.getElementById('currentSessionType');
      const sessionDurationElement = document.getElementById('currentSessionDuration');
      
      if (sessionTypeElement) {
        sessionTypeElement.textContent = this.session.session_type.replace('_', ' ').toUpperCase();
      }
      if (sessionDurationElement) {
        sessionDurationElement.textContent = `${this.session.planned_duration} minutes`;
      }
    }
  }

  updateUIForPausedSession() {
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resumeBtn = document.getElementById('pomodoroResumeBtn');

    if (pauseBtn) pauseBtn.style.display = 'none';
    if (resumeBtn) resumeBtn.style.display = 'inline-block';
  }

  resetSession() {
    this.session = null;
    this.timeRemaining = 0;

    const startBtn = document.getElementById('pomodoroStartBtn');
    const pauseBtn = document.getElementById('pomodoroPauseBtn');
    const resumeBtn = document.getElementById('pomodoroResumeBtn');
    const completeBtn = document.getElementById('pomodoroCompleteBtn');
    const cancelBtn = document.getElementById('pomodoroCancelBtn');
    const timerElement = document.getElementById('pomodoroTimer');

    if (startBtn) startBtn.style.display = 'inline-block';
    if (pauseBtn) pauseBtn.style.display = 'none';
    if (resumeBtn) resumeBtn.style.display = 'none';
    if (completeBtn) completeBtn.style.display = 'none';
    if (cancelBtn) cancelBtn.style.display = 'none';
    if (timerElement) timerElement.textContent = '25:00';

    // Reset progress bar
    const progressElement = document.getElementById('pomodoroProgress');
    if (progressElement) {
      progressElement.style.width = '0%';
    }
  }

  updateDurationFromType(sessionType) {
    if (!this.settings) return;

    let duration;
    switch (sessionType) {
      case 'work':
        duration = this.settings.work_duration;
        break;
      case 'short_break':
        duration = this.settings.short_break_duration;
        break;
      case 'long_break':
        duration = this.settings.long_break_duration;
        break;
      default:
        duration = 25;
    }

    const durationInput = document.getElementById('plannedDuration');
    if (durationInput) {
      durationInput.value = duration;
    }
  }

  suggestBreak() {
    // This could be enhanced to suggest appropriate break type based on session count
    if (this.settings && this.settings.auto_start_breaks) {
      setTimeout(() => {
        const sessionType = document.getElementById('sessionType');
        if (sessionType) {
          sessionType.value = 'short_break';
          this.updateDurationFromType('short_break');
        }
      }, 1000);
    }
  }

  showNotification(title, message) {
    if (this.settings && this.settings.notifications_enabled && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification(title, { body: message });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification(title, { body: message });
          }
        });
      }
    }

    // Also show in-app notification
    this.showInAppNotification(title, message);
  }

  showInAppNotification(title, message) {
    // Create a simple toast notification
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="font-semibold">${title}</div>
      <div class="text-sm">${message}</div>
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  showError(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
      <div class="font-semibold">Error</div>
      <div class="text-sm">${message}</div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.classList.remove('translate-x-full');
    }, 100);

    setTimeout(() => {
      notification.classList.add('translate-x-full');
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 5000);
  }

  updateSettingsUI() {
    // Update form fields if settings modal is open
    const workDurationInput = document.getElementById('settingsWorkDuration');
    const shortBreakInput = document.getElementById('settingsShortBreak');
    const longBreakInput = document.getElementById('settingsLongBreak');
    const sessionsBeforeLongBreakInput = document.getElementById('settingsSessionsBeforeLongBreak');
    const autoStartBreaksInput = document.getElementById('settingsAutoStartBreaks');
    const notificationsInput = document.getElementById('settingsNotifications');

    if (workDurationInput) workDurationInput.value = this.settings.work_duration;
    if (shortBreakInput) shortBreakInput.value = this.settings.short_break_duration;
    if (longBreakInput) longBreakInput.value = this.settings.long_break_duration;
    if (sessionsBeforeLongBreakInput) sessionsBeforeLongBreakInput.value = this.settings.sessions_before_long_break;
    if (autoStartBreaksInput) autoStartBreaksInput.checked = this.settings.auto_start_breaks;
    if (notificationsInput) notificationsInput.checked = this.settings.notifications_enabled;
  }

  showSettings() {
    // Implementation for showing settings modal would go here
    console.log('Show settings modal');
  }
}

// Initialize pomodoro timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pomodoroTimer')) {
    window.pomodoroTimer = new PomodoroTimer();
  }
});

export { PomodoroTimer };