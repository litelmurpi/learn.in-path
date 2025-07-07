// pomodoro_demo.js - Demo version without API calls

class PomodoroTimerDemo {
  constructor() {
    this.session = null;
    this.timerInterval = null;
    this.timeRemaining = 0;
    this.isRunning = false;
    this.settings = {
      work_duration: 25,
      short_break_duration: 5,
      long_break_duration: 15,
      sessions_before_long_break: 4,
      auto_start_breaks: false,
      notifications_enabled: true
    };
    
    this.bindEvents();
    this.updateDurationFromType('work');
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
    });

    // Session type selection
    document.addEventListener('change', (e) => {
      if (e.target.matches('#sessionType')) {
        this.updateDurationFromType(e.target.value);
      }
      if (e.target.matches('#createStudyLog')) {
        const container = document.getElementById('studyTopicContainer');
        if (container) {
          if (e.target.checked) {
            container.classList.remove('hidden');
          } else {
            container.classList.add('hidden');
          }
        }
      }
    });
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

    // Simulate session creation
    this.session = {
      id: Date.now(),
      session_type: sessionType,
      planned_duration: plannedDuration,
      status: 'active',
      started_at: new Date().toISOString(),
      notes: notes
    };

    this.timeRemaining = plannedDuration * 60; // Convert to seconds
    this.updateUIForActiveSession();
    this.startTimer();
    this.showNotification('Session started!', `${plannedDuration}-minute ${sessionType} session began.`);
  }

  pauseSession() {
    if (!this.session) return;

    this.session.status = 'paused';
    this.stopTimer();
    this.updateUIForPausedSession();
    this.showNotification('Session paused', 'Your session has been paused.');
  }

  resumeSession() {
    if (!this.session) return;

    this.session.status = 'active';
    this.startTimer();
    this.updateUIForActiveSession();
    this.showNotification('Session resumed', 'Your session has been resumed.');
  }

  completeSession() {
    if (!this.session) return;

    this.stopTimer();
    this.resetSession();
    this.showNotification('Session completed!', 'Great job! Your session has been completed.');
  }

  cancelSession() {
    if (!this.session) return;

    this.stopTimer();
    this.resetSession();
    this.showNotification('Session cancelled', 'Your session has been cancelled.');
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
    
    // Auto complete the session
    setTimeout(() => {
      this.completeSession();
    }, 2000);
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

    // Reset session info
    const sessionTypeElement = document.getElementById('currentSessionType');
    const sessionDurationElement = document.getElementById('currentSessionDuration');
    
    if (sessionTypeElement) {
      sessionTypeElement.textContent = 'READY';
    }
    if (sessionDurationElement) {
      sessionDurationElement.textContent = '';
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

    // Update timer display if no session is running
    if (!this.session) {
      const timerElement = document.getElementById('pomodoroTimer');
      if (timerElement) {
        const minutes = duration.toString().padStart(2, '0');
        timerElement.textContent = `${minutes}:00`;
      }
    }
  }

  showNotification(title, message) {
    // Show browser notification if supported
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    } else if ('Notification' in window && Notification.permission !== 'denied') {
      Notification.requestPermission().then(permission => {
        if (permission === 'granted') {
          new Notification(title, { body: message });
        }
      });
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
        if (notification.parentNode) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Initialize pomodoro timer when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pomodoroTimer')) {
    window.pomodoroTimerDemo = new PomodoroTimerDemo();
  }
});

export { PomodoroTimerDemo };