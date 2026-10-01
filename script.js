pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js';

const uploadInput = document.getElementById('pdf-upload');
const flipbookEl = document.getElementById('flipbook');
const loadingText = document.getElementById('loading');
const controls = document.getElementById('controls');
const zoomWrapper = document.querySelector('.zoom-wrapper');

let pageFlip;
let currentZoom = 1;
let totalPdfPages = 0;

//EVENTOS DE ZOOM
document.getElementById('zoom-in').addEventListener('click', () => {
    currentZoom += 0.2;
    zoomWrapper.style.transform = `scale(${currentZoom})`;
});

document.getElementById('zoom-out').addEventListener('click', () => {
    currentZoom -= 0.2;
    if (currentZoom < 0.4) currentZoom = 0.4;
    zoomWrapper.style.transform = `scale(${currentZoom})`;
});

//EVENTOS DE IR PARA PÁGINA
document.getElementById('go-to-page').addEventListener('click', () => {
    if(!pageFlip) return;
    const pageNum = parseInt(document.getElementById('page-input').value);
    
    if (pageNum >= 1 && pageNum <= totalPdfPages) {
        pageFlip.flip(pageNum - 1); 
    } else {
        alert(`Por favor, insira um número entre 1 e ${totalPdfPages}`);
    }
});

//CARREGAMENTO DO PDF
uploadInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(file && file.type === "application/pdf") {
        loadingText.style.display = 'block';
        controls.style.display = 'none';
        
        const fileReader = new FileReader();
        fileReader.onload = function() {
            const typedarray = new Uint8Array(this.result);
            loadPDF(typedarray);
        };
        fileReader.readAsArrayBuffer(file);
    } else {
        alert("Por favor, selecione um arquivo PDF válido.");
    }
});

async function loadPDF(pdfData) {
    try {
        flipbookEl.innerHTML = '';
        if (pageFlip) {
            pageFlip.destroy();
        }
        
        currentZoom = 1;
        zoomWrapper.style.transform = `scale(1)`;

        const pdf = await pdfjsLib.getDocument(pdfData).promise;
        totalPdfPages = pdf.numPages;
        
        document.getElementById('total-pages').textContent = `/ ${totalPdfPages}`;
        document.getElementById('page-input').max = totalPdfPages;
        
        let bookPages = [];

        for (let i = 1; i <= totalPdfPages; i++) {
            const page = await pdf.getPage(i);
            // Qualidade da renderização da página
            const viewport = page.getViewport({ scale: 1.5 }); 

            const pageDiv = document.createElement('div');
            pageDiv.className = 'page';
            
            if (i === 1 || i === totalPdfPages) {
                pageDiv.classList.add('page-cover');
                pageDiv.setAttribute('data-density', 'hard');
            } else {
                pageDiv.setAttribute('data-density', 'soft');
            }

            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            await page.render({ canvasContext: context, viewport: viewport }).promise;

            pageDiv.appendChild(canvas);
            flipbookEl.appendChild(pageDiv);
            bookPages.push(pageDiv);
        }

        //inicializa o Livro com configurações otimizadas para Mobile
        pageFlip = new St.PageFlip(flipbookEl, {
            // Proporção baseada no formato A4 (Retângulo clássico de folha sulfite)
            width: 350, 
            height: 495, 
            size: "stretch", // Estica para preencher a tela respeitando limite max/min
            minWidth: 250, // Permite encolher mais em celulares muito pequenos
            maxWidth: 500,
            minHeight: 353,
            maxHeight: 707,
            maxShadowOpacity: 0.5,
            showCover: true, 
            usePortrait: true,
            mobileScrollSupport: false 
        });

        pageFlip.loadFromHTML(bookPages);
        
        pageFlip.on('flip', (e) => {
            document.getElementById('page-input').value = e.data + 1;
        });
        
        loadingText.style.display = 'none';
        controls.style.display = 'inline-flex';

    } catch (error) {
        console.error("Erro ao carregar:", error);
        loadingText.textContent = "Ocorreu um erro ao processar o PDF.";
    }
}