document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('animationCanvas');
    const ctx = canvas.getContext('2d');

    // Set canvas dimensions
    canvas.width = 400;
    canvas.height = 400;

    let drawing = false;
    let currentPage = 0;
    const pages = [ctx.getImageData(0, 0, canvas.width, canvas.height)];

    // Function to start drawing
    function startDrawing(e) {
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

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = 'black';

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

    const switchPageButton = document.createElement('button');
    switchPageButton.textContent = 'Switch Page';
    switchPageButton.onclick = () => switchPage((currentPage + 1) % pages.length);
    controls.appendChild(switchPageButton);
});