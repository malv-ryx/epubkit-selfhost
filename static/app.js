// epubkit — Frontend

const uploadZone = document.getElementById('upload-zone');
const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const optionsPanel = document.getElementById('options-panel');
const progressSection = document.getElementById('progress-section');
const resultsSection = document.getElementById('results-section');
const processBtn = document.getElementById('process-btn');
const qualitySlider = document.getElementById('opt-quality');
const qualityValue = document.getElementById('quality-value');
const downloadAllBtn = document.getElementById('download-all-btn');

let uploadedFiles = []; // {task_id, filename, metadata, file_size}
let selectedDevice = 'x4'; // 'x4' (480x800) or 'x3' (528x792), both 4-level gray

// ==================== Theme Toggle ====================
const themeToggleBtn = document.getElementById('theme-toggle');
if (themeToggleBtn) {
    const themeIcon = themeToggleBtn.querySelector('.theme-toggle-icon');
    const themeText = themeToggleBtn.querySelector('.theme-toggle-text');

    function getPreferredTheme() {
        const savedTheme = localStorage.getItem('epubkit-theme');
        if (savedTheme) return savedTheme;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('epubkit-theme', theme);
        if (themeIcon && themeText) {
            if (theme === 'dark') {
                themeIcon.textContent = '☀️';
                themeText.textContent = 'Light';
            } else {
                themeIcon.textContent = '🌙';
                themeText.textContent = 'Dark';
            }
        }
    }

    setTheme(getPreferredTheme());

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme') || getPreferredTheme();
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
    });
}

// ==================== Upload ====================

const fileListHeader = document.getElementById('file-list-header');
const fileCountLabel = document.getElementById('file-count-label');
const addMoreBtn = document.getElementById('add-more-btn');
const clearAllBtn = document.getElementById('clear-all-btn');

if (addMoreBtn) {
    addMoreBtn.addEventListener('click', () => fileInput.click());
}

if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
        uploadedFiles = [];
        fileList.innerHTML = '';
        fileList.hidden = true;
        if (fileListHeader) fileListHeader.hidden = true;
        optionsPanel.hidden = true;
        
        // Hide and clear progress section
        progressSection.hidden = true;
        const progressItems = document.getElementById('progress-items');
        if (progressItems) progressItems.innerHTML = '';
        
        // Hide and clear results section
        resultsSection.hidden = true;
        const resultsItems = document.getElementById('results-items');
        if (resultsItems) resultsItems.innerHTML = '';
        downloadAllBtn.hidden = true;

        resetUploadZone();
    });
}

uploadZone.addEventListener('click', () => fileInput.click());

uploadZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadZone.classList.add('dragover');
});

uploadZone.addEventListener('dragleave', () => {
    uploadZone.classList.remove('dragover');
});

uploadZone.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

fileInput.addEventListener('change', () => {
    handleFiles(fileInput.files);
    fileInput.value = '';
});

async function handleFiles(files) {
    const epubFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.epub'));
    if (epubFiles.length === 0) return;

    const formData = new FormData();
    epubFiles.forEach(f => formData.append('files', f));

    // Show uploading state
    const uploadContent = uploadZone.querySelector('.upload-content');
    if (uploadContent) {
        uploadContent.innerHTML = `
            <div class="upload-spinner"></div>
            <p class="upload-label">Uploading${epubFiles.length > 1 ? ` ${epubFiles.length} files` : ''}...</p>
        `;
    }

    try {
        const response = await fetch('/upload', { method: 'POST', body: formData });
        const data = await response.json();

        data.files.forEach(file => {
            if (file.task_id) {
                uploadedFiles.push(file);
            }
        });

        renderFileList(data.files);
        updateFileCountHeader();
        optionsPanel.hidden = uploadedFiles.length === 0;
    } catch (err) {
        uploadZone.innerHTML = `<div class="upload-content"><p class="upload-label" style="color:var(--error)">Upload failed: ${err.message}</p></div>`;
    }

    // Reset upload zone
    setTimeout(() => {
        resetUploadZone();
    }, 400);
}

function updateFileCountHeader() {
    if (!fileListHeader) return;
    if (uploadedFiles.length > 0) {
        fileListHeader.hidden = false;
        fileCountLabel.textContent = `Uploaded Files (${uploadedFiles.length})`;
    } else {
        fileListHeader.hidden = true;
    }
}

function resetUploadZone() {
    uploadZone.innerHTML = `
        <div class="upload-content">
            <svg class="upload-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <p class="upload-label">${uploadedFiles.length > 0 ? 'Drop more EPUB files' : 'Drop EPUB files here'}</p>
            <p class="upload-hint">or click to browse &bull; up to 100 MB each</p>
        </div>`;
}

function renderFileList(files) {
    fileList.hidden = false;

    files.forEach(file => {
        const card = document.createElement('div');
        card.className = `file-card ${file.error ? 'error' : ''}`;
        card.dataset.taskId = file.task_id || '';

        const meta = file.metadata || {};
        const origTitle = meta.title || '';
        const origAuthor = meta.author || '';

        const coverHtml = meta.cover_data
            ? `<img src="data:image/jpeg;base64,${meta.cover_data}" alt="Cover">`
            : '<div class="no-cover">No cover</div>';

        const drmHtml = meta.has_drm
            ? `<span class="drm-badge" title="This file is protected with DRM encryption and cannot be optimized directly.">🔒 DRM Protected</span>`
            : '';

        const errorHtml = file.error
            ? `<div class="file-error">${file.error}</div>`
            : '';

        const editHtml = file.task_id && !file.error ? `
            <div class="file-edit" data-task="${file.task_id}">
                <input type="text" placeholder="Title" value="${escapeHtml(origTitle)}" data-field="title" data-task="${file.task_id}" data-original="${escapeHtml(origTitle)}">
                <input type="text" placeholder="Author" value="${escapeHtml(origAuthor)}" data-field="author" data-task="${file.task_id}" data-original="${escapeHtml(origAuthor)}">
                <button type="button" class="btn-reset-metadata" onclick="resetCardMetadata(this)" title="Revert to original extracted metadata">↺ Revert</button>
            </div>` : '';

        const sizeStr = file.file_size ? formatBytes(file.file_size) : '';
        const metaLine = [meta.author, meta.series].filter(Boolean).join(' \u2014 ');

        card.innerHTML = `
            <div class="file-cover">${coverHtml}</div>
            <div class="file-info">
                <div class="file-name">${escapeHtml(meta.title || file.filename)}${drmHtml}</div>
                <div class="file-meta">${escapeHtml(metaLine)}${sizeStr ? (metaLine ? ' \u00b7 ' : '') + sizeStr : ''}</div>
                ${errorHtml}
                ${editHtml}
            </div>
            ${file.task_id ? '<button class="file-remove" onclick="removeFile(\'' + file.task_id + '\', this)" title="Remove">&times;</button>' : ''}
        `;

        fileList.appendChild(card);
    });
}

function resetCardMetadata(btn) {
    const editContainer = btn.closest('.file-edit');
    if (!editContainer) return;
    const titleInput = editContainer.querySelector('input[data-field="title"]');
    const authorInput = editContainer.querySelector('input[data-field="author"]');
    if (titleInput && titleInput.dataset.original !== undefined) {
        titleInput.value = titleInput.dataset.original;
    }
    if (authorInput && authorInput.dataset.original !== undefined) {
        authorInput.value = authorInput.dataset.original;
    }
}

function removeFile(taskId, btn) {
    uploadedFiles = uploadedFiles.filter(f => f.task_id !== taskId);
    const card = btn.closest('.file-card');
    card.style.opacity = '0';
    card.style.transform = 'translateX(20px)';
    card.style.transition = 'all 0.2s ease';
    setTimeout(() => {
        card.remove();
        updateFileCountHeader();
        if (uploadedFiles.length === 0) {
            optionsPanel.hidden = true;
            fileList.hidden = true;
            if (fileListHeader) fileListHeader.hidden = true;
        }
    }, 200);
}

// ==================== Options ====================

// Device toggle
document.querySelectorAll('.device-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.device-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedDevice = btn.dataset.device;
    });
});

// Preset profiles
document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        const preset = btn.dataset.preset;
        if (preset === 'quick') {
            setOptions({ grayscale: true, contrast: true, fonts: false, css: false, cover: false, metadata: false, textcleanup: true, lightnovel: false, quality: 70 });
        } else if (preset === 'full') {
            setOptions({ grayscale: true, contrast: true, fonts: true, css: true, cover: true, metadata: true, textcleanup: true, lightnovel: false, quality: 70 });
        }
        // 'custom' doesn't change anything - user picks
    });
});

function setOptions(opts) {
    document.getElementById('opt-grayscale').checked = opts.grayscale;
    document.getElementById('opt-contrast').checked = opts.contrast;
    document.getElementById('opt-fonts').checked = opts.fonts;
    document.getElementById('opt-css').checked = opts.css;
    document.getElementById('opt-cover').checked = opts.cover;
    document.getElementById('opt-metadata').checked = opts.metadata;
    document.getElementById('opt-textcleanup').checked = opts.textcleanup;
    document.getElementById('opt-lightnovel').checked = opts.lightnovel;
    if (document.getElementById('opt-unwrapsvg')) {
        document.getElementById('opt-unwrapsvg').checked = opts.unwrapsvg !== undefined ? opts.unwrapsvg : true;
    }
    if (document.getElementById('opt-ncx')) {
        document.getElementById('opt-ncx').checked = opts.ncx !== undefined ? opts.ncx : true;
    }
    setQuality(opts.quality);
}

// Quality slider
qualitySlider.addEventListener('input', () => {
    qualityValue.textContent = qualitySlider.value + '%';
    document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
    const matching = document.querySelector(`.quality-btn[data-quality="${qualitySlider.value}"]`);
    if (matching) matching.classList.add('active');
});

document.querySelectorAll('.quality-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        setQuality(parseInt(btn.dataset.quality));
    });
});

function setQuality(val) {
    qualitySlider.value = val;
    qualityValue.textContent = val + '%';
    document.querySelectorAll('.quality-btn').forEach(b => b.classList.remove('active'));
    const matching = document.querySelector(`.quality-btn[data-quality="${val}"]`);
    if (matching) matching.classList.add('active');
}

// When any option changes, switch to Custom preset
document.querySelectorAll('.option input, #opt-quality').forEach(input => {
    input.addEventListener('change', () => {
        document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.preset-btn[data-preset="custom"]').classList.add('active');
    });
});

// ==================== Processing ====================

processBtn.addEventListener('click', startProcessing);

async function startProcessing() {
    const validFiles = uploadedFiles.filter(f => f.task_id && !f.error);
    if (validFiles.length === 0) return;

    processBtn.disabled = true;
    processBtn.innerHTML = `
        <svg class="spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
            <path d="M21 12a9 9 0 11-6.219-8.56"/>
        </svg>
        Processing...`;
    progressSection.hidden = false;
    resultsSection.hidden = true;

    const options = getOptions();
    const completedIds = [];

    // Create progress items
    const progressItems = document.getElementById('progress-items');
    progressItems.innerHTML = '';
    for (const file of validFiles) {
        const item = document.createElement('div');
        item.className = 'progress-item';
        item.id = `progress-${file.task_id}`;
        item.innerHTML = `
            <div class="progress-header">
                <span class="progress-title">${escapeHtml(file.metadata?.title || file.filename)}</span>
                <span class="progress-percent" id="pct-${file.task_id}">0%</span>
            </div>
            <div class="progress-bar-bg">
                <div class="progress-bar" id="bar-${file.task_id}"></div>
            </div>
            <div class="progress-message" id="msg-${file.task_id}">Waiting...</div>
        `;
        progressItems.appendChild(item);
    }

    // Process files sequentially
    for (const file of validFiles) {
        const titleInput = document.querySelector(`input[data-task="${file.task_id}"][data-field="title"]`);
        const authorInput = document.querySelector(`input[data-task="${file.task_id}"][data-field="author"]`);
        const editTitle = titleInput ? titleInput.value : '';
        const editAuthor = authorInput ? authorInput.value : '';

        try {
            const report = await processFile(file.task_id, options, editTitle, editAuthor);
            completedIds.push({ task_id: file.task_id, report });
        } catch (err) {
            completedIds.push({ task_id: file.task_id, report: { success: false, error: err.message } });
        }
    }

    setTimeout(() => {
        progressSection.hidden = true;
    }, 500);

    showResults(completedIds);

    processBtn.disabled = false;
    processBtn.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="18" height="18">
            <polyline points="16 16 12 12 8 16"/>
            <line x1="12" y1="12" x2="12" y2="21"/>
            <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
        </svg>
        Optimize EPUBs`;
}

function getOptions() {
    return {
        device: selectedDevice,
        grayscale: document.getElementById('opt-grayscale').checked,
        contrast: document.getElementById('opt-contrast').checked,
        quality: parseInt(qualitySlider.value),
        remove_fonts: document.getElementById('opt-fonts').checked,
        remove_css: document.getElementById('opt-css').checked,
        light_novel: document.getElementById('opt-lightnovel').checked,
        generate_cover: document.getElementById('opt-cover').checked,
        clean_metadata: document.getElementById('opt-metadata').checked,
        text_cleanup: document.getElementById('opt-textcleanup').checked,
        unwrap_svg: document.getElementById('opt-unwrapsvg') ? document.getElementById('opt-unwrapsvg').checked : true,
        generate_ncx: document.getElementById('opt-ncx') ? document.getElementById('opt-ncx').checked : true,
    };
}

function processFile(taskId, options, editTitle, editAuthor) {
    return new Promise((resolve, reject) => {
        const params = new URLSearchParams({
            device: options.device,
            grayscale: options.grayscale,
            contrast: options.contrast,
            quality: options.quality,
            remove_fonts: options.remove_fonts,
            remove_css: options.remove_css,
            light_novel: options.light_novel,
            generate_cover: options.generate_cover,
            clean_metadata: options.clean_metadata,
            text_cleanup: options.text_cleanup,
            unwrap_svg: options.unwrap_svg,
            generate_ncx: options.generate_ncx,
            edit_title: editTitle,
            edit_author: editAuthor,
        });

        const eventSource = new EventSource(`/process/${taskId}?${params}`);
        const bar = document.getElementById(`bar-${taskId}`);
        const msg = document.getElementById(`msg-${taskId}`);

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (bar) bar.style.width = `${data.percent}%`;
            if (msg) msg.textContent = data.message;

            if (data.status === 'done' || data.status === 'error') {
                eventSource.close();
                if (bar) bar.classList.add(data.status === 'done' ? 'complete' : 'error');
                resolve(data.report || data);
            }
        };

        eventSource.onerror = () => {
            eventSource.close();
            if (bar) bar.classList.add('error');
            if (msg) msg.textContent = 'Connection error';
            reject(new Error('SSE connection failed'));
        };
    });
}

// ==================== Results ====================

function showResults(completed) {
    resultsSection.hidden = false;
    const resultsItems = document.getElementById('results-items');
    resultsItems.innerHTML = '';

    const successIds = [];
    let totalOrig = 0;
    let totalOpt = 0;

    completed.forEach(({ report }) => {
        if (report && report.success) {
            totalOrig += report.original_size || 0;
            totalOpt += report.optimized_size || 0;
        }
    });

    if (totalOrig > 0 && totalOrig > totalOpt) {
        const savedBytes = totalOrig - totalOpt;
        const overallPercent = ((1 - totalOpt / totalOrig) * 100).toFixed(1);
        const banner = document.createElement('div');
        banner.className = 'total-savings-banner';
        banner.innerHTML = `🎉 <strong>Total Savings:</strong> Saved ${formatBytes(savedBytes)} across ${completed.length} book(s) (${overallPercent}% overall space reduction)`;
        resultsItems.appendChild(banner);
    }

    completed.forEach(({ task_id, report }) => {
        const card = document.createElement('div');
        card.className = `result-card ${report.success ? 'success' : 'error'}`;

        if (report.success) {
            successIds.push(task_id);
            const reduction = report.original_size > 0
                ? ((1 - report.optimized_size / report.original_size) * 100).toFixed(1)
                : 0;

            // Build summary badges
            const badgesHtml = [];
            if (report.images_converted > 0) {
                badgesHtml.push(`<span class="stat-badge image-badge">🖼️ ${report.images_converted}/${report.images_total} Images</span>`);
            }
            if (report.fonts_removed > 0) {
                badgesHtml.push(`<span class="stat-badge font-badge">🔤 ${report.fonts_removed} Fonts Removed</span>`);
            }
            if (report.css_rules_removed > 0 || report.attrs_stripped > 0) {
                badgesHtml.push(`<span class="stat-badge css-badge">🧹 DOM & CSS Cleaned</span>`);
            }
            if (report.text_fixes_total > 0) {
                badgesHtml.push(`<span class="stat-badge text-badge">📝 Text Normalized</span>`);
            }

            // Build structured summary list items
            const itemsHtml = [];
            if (report.images_converted > 0) {
                itemsHtml.push(`<li><span class="item-icon">🖼️</span> <div><strong>Images:</strong> Converted ${report.images_converted}/${report.images_total} to 4-level e-ink grayscale JPEGs</div></li>`);
            }
            if (report.fonts_removed > 0) {
                itemsHtml.push(`<li><span class="item-icon">🔤</span> <div><strong>Fonts:</strong> Removed ${report.fonts_removed} embedded font files & @font-face rules</div></li>`);
            }
            if (report.css_rules_removed > 0 || report.attrs_stripped > 0) {
                const parts = [];
                if (report.css_rules_removed > 0) parts.push(`${report.css_rules_removed} unused CSS rules`);
                if (report.attrs_stripped > 0) parts.push(`${report.attrs_stripped} bloat attributes`);
                itemsHtml.push(`<li><span class="item-icon">🧹</span> <div><strong>DOM & CSS:</strong> Stripped ${parts.join(' & ')}</div></li>`);
            }
            if (report.text_fixes_total > 0) {
                itemsHtml.push(`<li><span class="item-icon">📝</span> <div><strong>Text Cleanup:</strong> ${escapeHtml(report.text_cleanup_summary)}</div></li>`);
            }
            if (report.metadata_items_stripped > 0) {
                itemsHtml.push(`<li><span class="item-icon">📚</span> <div><strong>Metadata:</strong> Stripped ${report.metadata_items_stripped} store-specific metadata tags</div></li>`);
            }
            if (report.toc_status) {
                itemsHtml.push(`<li><span class="item-icon">📑</span> <div><strong>Table of Contents:</strong> ${escapeHtml(report.toc_status)}</div></li>`);
            }

            // Build collapsible log drawer if image details exist
            let drawerHtml = '';
            if (report.image_details && report.image_details.length > 0) {
                const detailsList = report.image_details.map((d, idx) => `<div><span class="log-num">#${idx + 1}</span> ${escapeHtml(d)}</div>`).join('');
                drawerHtml = `
                    <details class="log-drawer">
                        <summary>🔍 View Detailed Image Log (${report.image_details.length} files)</summary>
                        <div class="log-drawer-content">${detailsList}</div>
                    </details>
                `;
            }

            card.innerHTML = `
                <div class="result-header">
                    <span class="filename">${escapeHtml(report.output_filename || 'optimized.epub')}</span>
                </div>
                <div class="result-size">
                    <span class="size-original">${formatBytes(report.original_size)}</span>
                    <span class="size-arrow">&rarr;</span>
                    <span class="size-new">${formatBytes(report.optimized_size)}</span>
                    <span class="size-reduction">&minus;${reduction}%</span>
                </div>
                <div class="stat-badges">${badgesHtml.join('')}</div>
                <ul class="result-breakdown">${itemsHtml.join('')}</ul>
                ${drawerHtml}
                <a href="/download/${task_id}" class="download-btn" download>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="7 10 12 15 17 10"/>
                        <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                    Download
                </a>
            `;
        } else {
            card.innerHTML = `
                <div class="result-header">
                    <span class="filename">Error</span>
                </div>
                <div class="file-error">${escapeHtml(report.error)}</div>
            `;
        }

        resultsItems.appendChild(card);
    });

    // Show Download All button for batch
    if (successIds.length > 1) {
        downloadAllBtn.hidden = false;
        downloadAllBtn.onclick = () => {
            window.location.href = `/download-all?task_ids=${successIds.join(',')}`;
        };
    } else {
        downloadAllBtn.hidden = true;
    }

    // Scroll results into view
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ==================== Utilities ====================

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Spinning animation for processing button
const style = document.createElement('style');
style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
    .spin { animation: spin 1s linear infinite; }
    .upload-spinner {
        width: 28px; height: 28px;
        border: 3px solid var(--border);
        border-top-color: var(--accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin: 0 auto 12px;
    }
`;
document.head.appendChild(style);
