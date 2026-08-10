// Dashboard Content Management

const Dashboard = {
  // Video upload state
  uploadState: {
    draft: {
      file: null,
      caption: '',
    },
    publish: {
      file: null,
      caption: '',
      hashtags: '',
    },
  },

  // Initialize dashboard
  init() {
    if (!TikTokAuth.isAuthenticated()) {
      return; // Will be redirected by auth check
    }

    this.setupEventListeners();
    this.loadPublicationHistory();
  },

  // Setup form event listeners
  setupEventListeners() {
    // Draft upload form
    const draftForm = document.getElementById('upload-draft-form');
    if (draftForm) {
      draftForm.addEventListener('submit', (e) => this.handleDraftSubmit(e));

      document.getElementById('video-file-draft').addEventListener('change', (e) => {
        this.uploadState.draft.file = e.target.files[0];
        this.validateForm('draft');
      });

      document.getElementById('caption-draft').addEventListener('input', (e) => {
        this.uploadState.draft.caption = e.target.value;
      });
    }

    // Publish form
    const publishForm = document.getElementById('publish-form');
    if (publishForm) {
      publishForm.addEventListener('submit', (e) => this.handlePublishSubmit(e));

      document.getElementById('video-file-publish').addEventListener('change', (e) => {
        this.uploadState.publish.file = e.target.files[0];
        this.previewVideo(e.target.files[0]);
        this.validateForm('publish');
      });

      document.getElementById('caption-publish').addEventListener('input', (e) => {
        this.uploadState.publish.caption = e.target.value;
      });

      document.getElementById('hashtags').addEventListener('input', (e) => {
        this.uploadState.publish.hashtags = e.target.value;
      });
    }

    // Modal controls
    const previewModal = document.getElementById('preview-modal');
    const statusModal = document.getElementById('status-modal');

    if (previewModal) {
      document.querySelector('.modal-close')?.addEventListener('click', () => {
        this.closeModal('preview-modal');
      });

      document.getElementById('cancel-publish')?.addEventListener('click', () => {
        this.closeModal('preview-modal');
      });

      document.getElementById('confirm-publish')?.addEventListener('click', () => {
        this.executePublish();
      });

      previewModal.addEventListener('click', (e) => {
        if (e.target === previewModal) {
          this.closeModal('preview-modal');
        }
      });
    }

    if (statusModal) {
      document.getElementById('close-status')?.addEventListener('click', () => {
        this.closeModal('status-modal');
        this.loadPublicationHistory();
      });

      statusModal.addEventListener('click', (e) => {
        if (e.target === statusModal) {
          // Don't close status modal while processing
          if (!statusModal.classList.contains('processing')) {
            this.closeModal('status-modal');
          }
        }
      });
    }
  },

  // Validate form inputs
  validateForm(type) {
    const form = type === 'draft' ? document.getElementById('upload-draft-form') : document.getElementById('publish-form');
    const file = this.uploadState[type].file;
    const btn = form?.querySelector('button[type="submit"]');

    if (file) {
      btn.disabled = false;
    } else {
      btn.disabled = true;
    }
  },

  // Handle draft upload submission
  async handleDraftSubmit(e) {
    e.preventDefault();

    const { file, caption } = this.uploadState.draft;
    if (!file) return;

    // Validate file
    if (!this.validateVideoFile(file)) {
      this.showStatus('draft', 'error', 'Invalid file format. Please use MP4, MOV, or WebM.');
      return;
    }

    // Show loading status
    this.showStatus('draft', 'loading', 'Preparing video upload...');

    try {
      // Simulate upload to TikTok
      await this.simulateDraftUpload(file, caption);

      // Show success message
      this.showStatus('draft', 'success', '✓ Video uploaded as draft! Check your TikTok app to review and publish.');

      // Reset form
      document.getElementById('upload-draft-form').reset();
      this.uploadState.draft = { file: null, caption: '' };

      // Add to history
      this.recordPublication('draft', file.name, caption);

      // Clear status after 3 seconds
      setTimeout(() => {
        this.clearStatus('draft');
      }, 4000);
    } catch (error) {
      this.showStatus('draft', 'error', 'Upload failed: ' + error.message);
    }
  },

  // Handle publish submission
  async handlePublishSubmit(e) {
    e.preventDefault();

    const { file, caption, hashtags } = this.uploadState.publish;
    if (!file) return;

    // Validate file
    if (!this.validateVideoFile(file)) {
      this.showStatus('publish', 'error', 'Invalid file format. Please use MP4, MOV, or WebM.');
      return;
    }

    // Show preview modal
    this.showPreviewModal(file, caption, hashtags);
  },

  // Validate video file
  validateVideoFile(file) {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
    const maxSize = 2 * 1024 * 1024 * 1024; // 2GB

    if (!validTypes.includes(file.type)) {
      return false;
    }

    if (file.size > maxSize) {
      return false;
    }

    return true;
  },

  // Preview video file
  previewVideo(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const videoEl = document.getElementById('preview-video');
      if (videoEl) {
        videoEl.src = e.target.result;
      }
    };
    reader.readAsArrayBuffer(file);
  },

  // Show preview modal
  showPreviewModal(file, caption, hashtags) {
    // Update preview content
    document.getElementById('preview-caption').textContent = caption || '(No caption)';
    document.getElementById('preview-hashtags').textContent = hashtags || '(No hashtags)';

    // Preview video
    const reader = new FileReader();
    reader.onload = (e) => {
      const videoEl = document.getElementById('preview-video');
      videoEl.src = e.target.result;
    };
    reader.readAsArrayBuffer(file);

    // Show modal
    this.showModal('preview-modal');
  },

  // Execute publish (after confirmation)
  async executePublish() {
    this.closeModal('preview-modal');

    const { file, caption, hashtags } = this.uploadState.publish;

    // Show status modal
    this.showModal('status-modal');
    document.getElementById('status-modal').classList.add('processing');
    document.getElementById('close-status').style.display = 'none';

    try {
      // Simulate publishing to TikTok
      await this.simulatePublish(file, caption, hashtags);

      // Show success
      document.getElementById('status-icon').textContent = '✅';
      document.getElementById('status-title').textContent = 'Video Published Successfully!';
      document.getElementById('status-message').textContent = 'Your video is now live on your TikTok profile.';

      // Reset form
      document.getElementById('publish-form').reset();
      this.uploadState.publish = { file: null, caption: '', hashtags: '' };

      // Add to history
      this.recordPublication('published', file.name, caption);

      // Show close button
      document.getElementById('status-modal').classList.remove('processing');
      document.getElementById('close-status').style.display = 'block';
    } catch (error) {
      // Show error
      document.getElementById('status-icon').textContent = '❌';
      document.getElementById('status-title').textContent = 'Publication Failed';
      document.getElementById('status-message').textContent = error.message;

      document.getElementById('status-modal').classList.remove('processing');
      document.getElementById('close-status').style.display = 'block';
    }
  },

  // Simulate draft upload to TikTok
  async simulateDraftUpload(file, caption) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/fail for demo
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Network error. Please try again.'));
        }
      }, 3000);
    });
  },

  // Simulate publish to TikTok
  async simulatePublish(file, caption, hashtags) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate random success/fail for demo
        if (Math.random() > 0.1) {
          resolve();
        } else {
          reject(new Error('Publishing error. Please try again.'));
        }
      }, 4000);
    });
  },

  // Show status message
  showStatus(type, status, message) {
    const statusEl = document.getElementById(`${type}-status`);
    if (!statusEl) return;

    statusEl.textContent = message;
    statusEl.className = `status-message ${status}`;
  },

  // Clear status message
  clearStatus(type) {
    const statusEl = document.getElementById(`${type}-status`);
    if (statusEl) {
      statusEl.className = 'status-message';
      statusEl.textContent = '';
    }
  },

  // Show modal
  showModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
    }
  },

  // Close modal
  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  // Record publication in history
  recordPublication(type, filename, caption) {
    const publications = JSON.parse(localStorage.getItem('tiktok_publications') || '[]');

    publications.unshift({
      id: Date.now(),
      type: type, // 'draft' or 'published'
      filename: filename,
      caption: caption,
      timestamp: new Date().toISOString(),
    });

    // Keep only last 50 publications
    publications.splice(50);

    localStorage.setItem('tiktok_publications', JSON.stringify(publications));
  },

  // Load and display publication history
  loadPublicationHistory() {
    const publications = JSON.parse(localStorage.getItem('tiktok_publications') || '[]');
    const activityList = document.getElementById('activity-list');

    if (!activityList) return;

    if (publications.length === 0) {
      activityList.innerHTML = `
        <div class="activity-empty">
          <p>No publications yet. Upload your first video to get started!</p>
        </div>
      `;
      return;
    }

    activityList.innerHTML = publications.map((pub) => {
      const date = new Date(pub.timestamp);
      const timeStr = date.toLocaleString();
      const typeLabel = pub.type === 'draft' ? 'Draft' : 'Published';
      const typeClass = pub.type === 'draft' ? 'draft' : 'published';

      return `
        <div class="activity-item">
          <div class="activity-info">
            <h3>${pub.filename}</h3>
            <p>${pub.caption || '(No caption)'}</p>
            <p style="color: #9ca3af; font-size: 0.8rem;">${timeStr}</p>
          </div>
          <div class="activity-status ${typeClass}">${typeLabel}</div>
        </div>
      `;
    }).join('');
  },
};

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => Dashboard.init());
} else {
  Dashboard.init();
}
