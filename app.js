document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = 400;
    canvas.height = 400;

    let drawing = false;
    let currentPage = 0;
    let tool = 'pencil'; // Default tool is pencil
    const pages = [ctx.getImageData(0, 0, canvas.width, canvas.height)];
    let animationInterval;

    // Open IndexedDB
    const request = indexedDB.open('FlipBookDB', 1);
    let db;

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        db.createObjectStore('animations', { keyPath: 'name' });
    };

    request.onsuccess = function(event) {
        db = event.target.result;
    };

    request.onerror = function(event) {
        console.error('Database error:', event.target.errorCode);
    };

    // Function to start drawing
    function startDrawing(e) {
        if (animationInterval) return; // Prevent drawing while playing
        drawing = true;
        draw(e);
    }

    // Function to stop drawing
    function stopDrawing() {
        drawing = false;
        ctx.beginPath();
    }

    // Function to draw on the canvas
    function draw(e) {
        if (!drawing) return;

        ctx.lineWidth = tool === 'pencil' ? 2 : 10; // Eraser is wider than pencil
        ctx.lineCap = 'round';
        ctx.strokeStyle = tool === 'pencil' ? 'black' : 'white';

        // Get the position for both mouse and touch events
        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches[0].clientX) - rect.left;
        const y = (e.clientY || e.touches[0].clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    }

    // Function to switch to a different page
    function switchPage(index) {
        if (index < 0 || index >= pages.length) return;
        pages[currentPage] = ctx.getImageData(0, 0, canvas.width, canvas.height);
        currentPage = index;
        ctx.putImageData(pages[currentPage], 0, 0);
    }

    // Function to add a new page
    function addPage() {
        pages.push(ctx.createImageData(canvas.width, canvas.height));
        switchPage(pages.length - 1);
    }

    // Function to switch tools
    function switchTool(selectedTool) {
        tool = selectedTool;
    }

    // Function to save the current animation
    function saveAnimation() {
        const name = prompt('Enter a name for your animation:');
        if (!name) return;

        const transaction = db.transaction(['animations'], 'readwrite');
        const store = transaction.objectStore('animations');
        const animationData = pages.map(page => page.data);
        store.put({ name, pages: animationData }); // Use put to replace if exists
    }

    // Function to load animations
    function loadAnimations() {
        const transaction = db.transaction(['animations'], 'readonly');
        const store = transaction.objectStore('animations');
        const request = store.getAll();

        request.onsuccess = function(event) {
            const animations = event.target.result;
            if (animations.length > 0) {
                const animationNames = animations.map(animation => animation.name);
                const selectedName = prompt('Choose an animation to load:', animationNames.join(', '));
                const animation = animations.find(anim => anim.name === selectedName);
                if (animation) {
                    pages.length = 0;
                    animation.pages.forEach(pageData => {
                        const imageData = new ImageData(new Uint8ClampedArray(pageData), canvas.width, canvas.height);
                        pages.push(imageData);
                    });
                    currentPage = 0; // Reset to the first page
                    ctx.putImageData(pages[currentPage], 0, 0); // Display the first page
                }
            }
        };
    }

    // Function to play the animation
    function playAnimation() {
        if (animationInterval) return; // Prevent multiple intervals
        animationInterval = setInterval(() => {
            currentPage = (currentPage + 1) % pages.length;
            ctx.putImageData(pages[currentPage], 0, 0);
        }, 1000 / 24); // 24 frames per second
    }

    // Function to pause the animation
    function pauseAnimation() {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    // Event listeners for mouse actions
    canvas.addEventListener('mousedown', startDrawing);
    canvas.addEventListener('mouseup', stopDrawing);
    canvas.addEventListener('mousemove', draw);

    // Event listeners for touch actions
    canvas.addEventListener('touchstart', startDrawing);
    canvas.addEventListener('touchend', stopDrawing);
    canvas.addEventListener('touchmove', draw);

    // Prevent scrolling when touching the canvas
    canvas.addEventListener('touchstart', (e) => e.preventDefault());
    canvas.addEventListener('touchmove', (e) => e.preventDefault());

    // Add buttons for adding and switching pages
    const controls = document.getElementById('controls');
    const addPageButton = document.createElement('button');
    addPageButton.textContent = 'Add Page';
    addPageButton.onclick = addPage;
    controls.appendChild(addPageButton);

    const nextPageButton = document.createElement('button');
    nextPageButton.textContent = 'Next Page';
    nextPageButton.onclick = () => switchPage((currentPage + 1) % pages.length);
    controls.appendChild(nextPageButton);

    const prevPageButton = document.createElement('button');
    prevPageButton.textContent = 'Previous Page';
    prevPageButton.onclick = () => switchPage((currentPage - 1 + pages.length) % pages.length);
    controls.appendChild(prevPageButton);

    // Add buttons for switching tools
    const pencilButton = document.createElement('button');
    pencilButton.textContent = 'Pencil';
    pencilButton.onclick = () => switchTool('pencil');
    controls.appendChild(pencilButton);

    const eraserButton = document.createElement('button');
    eraserButton.textContent = 'Eraser';
    eraserButton.onclick = () => switchTool('eraser');
    controls.appendChild(eraserButton);

    // Add buttons for saving and loading animations
    const saveButton = document.createElement('button');
    saveButton.textContent = 'Save Animation';
    saveButton.onclick = saveAnimation;
    controls.appendChild(saveButton);

    const loadButton = document.createElement('button');
    loadButton.textContent = 'Load Animation';
    loadButton.onclick = loadAnimations;
    controls.appendChild(loadButton);

    // Add buttons for playing and pausing animations
    const playButton = document.createElement('button');
    playButton.textContent = 'Play';
    playButton.onclick = playAnimation;
    controls.appendChild(playButton);

    const pauseButton = document.createElement('button');
    pauseButton.textContent = 'Pause';
    pauseButton.onclick = pauseAnimation;
    controls.appendChild(pauseButton);
});