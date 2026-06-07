// Loading Screen
window.addEventListener('load', () => {
    const loading = document.getElementById('loadingScreen');
    if (loading) {
        setTimeout(() => {
            loading.style.opacity = '0';
            setTimeout(() => loading.remove(), 500);
        }, 1200);
    }
    loadWebsites();
    updateStats();
    setTimeout(() => showToast('Welcome to BLACK HOST - Free Website Hosting!', 'success'), 1500);
});

// Toast Notification
function showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-info-circle'}"></i><span>${message}</span>`;
    container.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// Navbar Scroll
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 50) navbar.style.padding = '10px 0';
        else navbar.style.padding = '15px 0';
    }
});

// Mobile Menu
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
if (menuToggle) menuToggle.addEventListener('click', () => navLinks.classList.toggle('active'));

// Smooth Scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
            navLinks.classList.remove('active');
        }
    });
});

// Back to Top
const backBtn = document.getElementById('backToTop');
window.addEventListener('scroll', () => {
    if (backBtn) {
        if (window.scrollY > 300) backBtn.classList.add('visible');
        else backBtn.classList.remove('visible');
    }
});
if (backBtn) backBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

// Active Nav Link
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('section');
    const scrollPos = window.scrollY + 100;
    sections.forEach(section => {
        if (scrollPos >= section.offsetTop && scrollPos < section.offsetTop + section.offsetHeight) {
            const id = section.getAttribute('id');
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.getAttribute('href') === `#${id}`) link.classList.add('active');
            });
        }
    });
});

// ============ WEBSITE HOSTING SYSTEM ============
let websites = JSON.parse(localStorage.getItem('hosted_websites')) || [];
let currentPreviewId = null;

function saveWebsites() {
    localStorage.setItem('hosted_websites', JSON.stringify(websites));
}

function updateStats() {
    document.getElementById('activeSites').textContent = websites.length;
    const totalStorage = websites.reduce((sum, site) => sum + (site.totalSize || 0), 0);
    document.getElementById('totalStorage').textContent = Math.round(totalStorage / 1024);
    const totalViews = websites.reduce((sum, site) => sum + (site.views || 0), 0);
    document.getElementById('totalViews').textContent = totalViews;
}

function loadWebsites() {
    const container = document.getElementById('websitesContainer');
    if (!container) return;
    
    if (websites.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-folder-open"></i>
                <p>No websites hosted yet. Upload your first website above!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = websites.map((site, index) => `
        <div class="website-card">
            <div class="website-icon"><i class="fas fa-code"></i></div>
            <h4>${escapeHtml(site.name)}</h4>
            <div class="website-date">Uploaded: ${site.date}</div>
            <div class="website-actions">
                <button onclick="previewWebsite(${index})"><i class="fas fa-eye"></i> Preview</button>
                <button onclick="deleteWebsite(${index})"><i class="fas fa-trash"></i> Delete</button>
            </div>
        </div>
    `).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// File Upload Handling
const uploadBox = document.getElementById('uploadBox');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadProgress = document.getElementById('uploadProgress');
const progressBar = document.querySelector('.progress-bar');
const uploadSuccess = document.getElementById('uploadSuccess');

// Drag & Drop
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = '#f59e0b';
    uploadBox.style.background = 'rgba(245, 158, 11, 0.05)';
});

uploadBox.addEventListener('dragleave', () => {
    uploadBox.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    uploadBox.style.background = 'transparent';
});

uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.style.borderColor = 'rgba(245, 158, 11, 0.3)';
    uploadBox.style.background = 'transparent';
    const files = Array.from(e.dataTransfer.files);
    if (files.length) handleFiles(files);
});

uploadBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length) handleFiles(Array.from(e.target.files));
});

function handleFiles(files) {
    const htmlFiles = files.filter(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
    if (htmlFiles.length === 0) {
        showToast('Please upload at least one HTML file', 'error');
        return;
    }
    
    uploadProgress.style.display = 'block';
    uploadSuccess.style.display = 'none';
    progressBar.style.width = '0%';
    
    let processed = 0;
    const totalFiles = files.length;
    const websiteFiles = [];
    
    files.forEach(file => {
        const reader = new FileReader();
        reader.onload = function(e) {
            websiteFiles.push({
                name: file.name,
                content: e.target.result,
                size: file.size,
                type: file.type
            });
            processed++;
            const percent = (processed / totalFiles) * 100;
            progressBar.style.width = percent + '%';
            document.getElementById('uploadStatus').textContent = `Uploading ${processed}/${totalFiles} files...`;
            
            if (processed === totalFiles) {
                createWebsite(websiteFiles);
            }
        };
        reader.readAsDataURL(file);
    });
}

function createWebsite(files) {
    const mainHtml = files.find(f => f.name.toLowerCase() === 'index.html') || files.find(f => f.name.endsWith('.html'));
    const siteId = Date.now();
    const siteName = mainHtml?.name.replace('.html', '').replace('.htm', '') || 'My Website';
    
    const newWebsite = {
        id: siteId,
        name: siteName,
        date: new Date().toLocaleDateString(),
        files: files,
        totalSize: files.reduce((sum, f) => sum + f.size, 0),
        views: 0
    };
    
    websites.unshift(newWebsite);
    saveWebsites();
    updateStats();
    loadWebsites();
    
    uploadProgress.style.display = 'none';
    uploadSuccess.style.display = 'block';
    currentPreviewId = siteId;
    
    // Store for preview button
    sessionStorage.setItem('lastUploadedId', siteId);
    
    showToast(`Website "${siteName}" hosted successfully!`, 'success');
}

// Preview Website
window.previewWebsite = function(index) {
    const site = websites[index];
    if (site) {
        currentPreviewId = site.id;
        displayPreview(site);
        // Scroll to preview section
        document.querySelector('#preview').scrollIntoView({ behavior: 'smooth' });
        
        // Update view count
        site.views++;
        saveWebsites();
        updateStats();
    }
};

function displayPreview(site) {
    const previewFrame = document.getElementById('previewFrame');
    const previewUrlSpan = document.getElementById('previewUrl');
    
    previewUrlSpan.textContent = `${site.name} - ${site.files.length} files`;
    
    // Find the main HTML file
    const htmlFile = site.files.find(f => f.name.toLowerCase() === 'index.html') || 
                     site.files.find(f => f.name.endsWith('.html') || f.name.endsWith('.htm'));
    
    if (htmlFile) {
        // Decode base64 content
        let htmlContent = htmlFile.content;
        if (htmlContent.startsWith('data:')) {
            const base64Data = htmlContent.split(',')[1];
            htmlContent = atob(base64Data);
        }
        
        // Inject CSS files
        site.files.forEach(file => {
            if (file.name.endsWith('.css')) {
                let cssContent = file.content;
                if (cssContent.startsWith('data:')) {
                    const base64Data = cssContent.split(',')[1];
                    cssContent = atob(base64Data);
                }
                const styleTag = `<style>/* ${file.name} */\n${cssContent}\n</style>`;
                htmlContent = htmlContent.replace('</head>', styleTag + '</head>');
            }
        });
        
        // Inject JS files
        site.files.forEach(file => {
            if (file.name.endsWith('.js')) {
                let jsContent = file.content;
                if (jsContent.startsWith('data:')) {
                    const base64Data = jsContent.split(',')[1];
                    jsContent = atob(base64Data);
                }
                const scriptTag = `<script>/* ${file.name} */\n${jsContent}\n<\/script>`;
                htmlContent = htmlContent.replace('</body>', scriptTag + '</body>');
            }
        });
        
        // Create blob and display
        const blob = new Blob([htmlContent], { type: 'text/html' });
        const blobUrl = URL.createObjectURL(blob);
        previewFrame.src = blobUrl;
        
        // Cleanup old URL
        if (window.currentBlobUrl) URL.revokeObjectURL(window.currentBlobUrl);
        window.currentBlobUrl = blobUrl;
        
        showToast(`Previewing ${site.name}`, 'success');
    } else {
        previewFrame.src = 'about:blank';
        showToast('No HTML file found in this website', 'error');
    }
}

// Delete Website
window.deleteWebsite = function(index) {
    if (confirm('Delete this website? This action cannot be undone.')) {
        websites.splice(index, 1);
        saveWebsites();
        loadWebsites();
        updateStats();
        
        if (currentPreviewId === websites[index]?.id) {
            document.getElementById('previewFrame').src = 'about:blank';
            document.getElementById('previewUrl').textContent = 'No website selected';
            currentPreviewId = null;
        }
        showToast('Website deleted successfully', 'success');
    }
};

// View uploaded button
document.getElementById('viewUploadedBtn')?.addEventListener('click', () => {
    const lastId = sessionStorage.getItem('lastUploadedId');
    if (lastId) {
        const site = websites.find(s => s.id == lastId);
        if (site) {
            displayPreview(site);
            document.querySelector('#preview').scrollIntoView({ behavior: 'smooth' });
        } else {
            showToast('No website found', 'error');
        }
    } else if (websites.length > 0) {
        displayPreview(websites[0]);
        document.querySelector('#preview').scrollIntoView({ behavior: 'smooth' });
    } else {
        showToast('No websites to preview', 'error');
    }
});

// Copy URL button
document.getElementById('copyWebsiteUrlBtn')?.addEventListener('click', () => {
    const lastId = sessionStorage.getItem('lastUploadedId');
    if (lastId) {
        const site = websites.find(s => s.id == lastId);
        if (site) {
            // Create a shareable data URL
            const htmlFile = site.files.find(f => f.name.toLowerCase() === 'index.html') || site.files.find(f => f.name.endsWith('.html'));
            if (htmlFile) {
                let htmlContent = htmlFile.content;
                if (htmlContent.startsWith('data:')) {
                    const base64Data = htmlContent.split(',')[1];
                    htmlContent = atob(base64Data);
                }
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                navigator.clipboard.writeText(url);
                showToast('Preview URL copied to clipboard!', 'success');
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } else {
                showToast('No HTML file found', 'error');
            }
        } else {
            showToast('No website found', 'error');
        }
    } else if (websites.length > 0) {
        const site = websites[0];
        const htmlFile = site.files.find(f => f.name.toLowerCase() === 'index.html') || site.files.find(f => f.name.endsWith('.html'));
        if (htmlFile) {
            let htmlContent = htmlFile.content;
            if (htmlContent.startsWith('data:')) {
                const base64Data = htmlContent.split(',')[1];
                htmlContent = atob(base64Data);
            }
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            navigator.clipboard.writeText(url);
            showToast('Preview URL copied to clipboard!', 'success');
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        }
    } else {
        showToast('No websites to share', 'error');
    }
});

// Refresh Preview
document.getElementById('refreshPreviewBtn')?.addEventListener('click', () => {
    if (currentPreviewId) {
        const site = websites.find(s => s.id === currentPreviewId);
        if (site) displayPreview(site);
        else showToast('Website not found', 'error');
    } else if (websites.length > 0) {
        displayPreview(websites[0]);
    } else {
        showToast('No website loaded', 'error');
    }
});

// Open in new tab
document.getElementById('openNewTabBtn')?.addEventListener('click', () => {
    const previewFrame = document.getElementById('previewFrame');
    if (previewFrame.src && previewFrame.src !== 'about:blank') {
        window.open(previewFrame.src, '_blank');
    } else {
        showToast('No website loaded', 'error');
    }
});

// Load last preview if exists
if (websites.length > 0) {
    displayPreview(websites[0]);
}

// Initialize
loadWebsites();
updateStats();