
/* ===== MODULAR SECTION LOADER ===== */
document.addEventListener("DOMContentLoaded", async function () {
  const containers = document.querySelectorAll("[data-section][data-src]");
  for (const container of containers) {
    try {
      const response = await fetch(container.dataset.src, { cache: "no-cache" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      container.outerHTML = await response.text();
    } catch (error) {
      console.error("Could not load section:", container.dataset.src, error);
      container.innerHTML = `
        <section>
          <div class="card">
            <h3>Section could not be loaded</h3>
            <p>Please check that the portfolio is being viewed through GitHub Pages or another web server.</p>
          </div>
        </section>`;
    }
  }

  /* Run scroll-reveal after all modular sections are inserted. */
  if (typeof initScrollReveal === "function") initScrollReveal();
});

function copyText(text,button){
  navigator.clipboard.writeText(text).then(function(){
    const old=button.innerHTML; button.innerHTML="✓ Copied";
    setTimeout(function(){button.innerHTML=old;},1400);
  }).catch(function(){
    const a=document.createElement("textarea"); a.value=text; document.body.appendChild(a);
    a.select(); document.execCommand("copy"); a.remove();
    const old=button.innerHTML; button.innerHTML="✓ Copied";
    setTimeout(function(){button.innerHTML=old;},1400);
  });
}

/* ===== RESUME PDF VIEWER ===== */

const resumePdfWorker =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

let resumePdfDoc = null;
let resumePageNum = 1;
let resumeScale = 1.0;
let resumeRenderTask = null;


/* ===== OPEN RESUME ===== */

async function openResume() {

  const modal = document.getElementById("resumeModal");

  if (!modal) return;

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  resumePdfDoc = null;
  resumePageNum = 1;
  resumeScale = 1.0;

  showResumeLoading(true);
  showResumeError(false);
  updateResumeControls();

  try {

    if (!window.pdfjsLib) {
      throw new Error("PDF.js did not load.");
    }

    pdfjsLib.GlobalWorkerOptions.workerSrc = resumePdfWorker;

    const loadingTask = pdfjsLib.getDocument({
      url: "profile/Nikhilji-resume.pdf"
    });

    resumePdfDoc = await loadingTask.promise;

    resumePageNum = 1;

    resumeScale = await getResumeFitScale(resumePageNum);

    await renderResumePage(resumePageNum);

  } catch (error) {

    console.error("Resume PDF error:", error);

    showResumeLoading(false);

    const errorText =
      document.getElementById("resumeErrorText");

    if (errorText) {
      errorText.textContent =
        "The PDF could not be loaded. Please website Page.";
    }

    showResumeError(true);
  }
}


/* ===== RENDER RESUME PAGE ===== */

async function renderResumePage(pageNum) {

  if (!resumePdfDoc) return;

  showResumeLoading(true);

  if (resumeRenderTask) {
    try {
      resumeRenderTask.cancel();
    } catch (e) {}
  }

  try {

    const page =
      await resumePdfDoc.getPage(pageNum);

    const viewport =
      page.getViewport({
        scale: resumeScale
      });

    const canvas =
      document.getElementById("resumeCanvas");

    if (!canvas) return;

    const ctx =
      canvas.getContext("2d", {
        alpha: false
      });

    const dpr =
      Math.min(
        window.devicePixelRatio || 1,
        2
      );

    canvas.width =
      Math.floor(viewport.width * dpr);

    canvas.height =
      Math.floor(viewport.height * dpr);

    canvas.style.width =
      viewport.width + "px";

    canvas.style.height =
      viewport.height + "px";

    ctx.setTransform(
      dpr,
      0,
      0,
      dpr,
      0,
      0
    );

    resumeRenderTask =
      page.render({
        canvasContext: ctx,
        viewport: viewport
      });

    await resumeRenderTask.promise;

    resumeRenderTask = null;

    showResumeLoading(false);

    updateResumeControls();

  } catch (error) {

    if (
      error &&
      error.name === "RenderingCancelledException"
    ) {
      return;
    }

    console.error(
      "Resume rendering error:",
      error
    );

    showResumeLoading(false);
  }
}


/* ===== FIT RESUME PAGE ===== */

async function getResumeFitScale(pageNum) {

  const page =
    await resumePdfDoc.getPage(pageNum);

  const base =
    page.getViewport({
      scale: 1
    });

  const stage =
    document.getElementById("resumeStage");

  if (!stage) return 1;

  const availableW =
    Math.max(
      stage.clientWidth - 56,
      280
    );

  const availableH =
    Math.max(
      stage.clientHeight - 56,
      280
    );

  return Math.min(
    availableW / base.width,
    availableH / base.height
  ) * 0.98;
}


/* ===== UPDATE CONTROLS ===== */

function updateResumeControls() {

  const total =
    resumePdfDoc
      ? resumePdfDoc.numPages
      : 1;

  const pageInfo =
    document.getElementById(
      "resumePageInfo"
    );

  const zoomLabel =
    document.getElementById(
      "resumeZoomLabel"
    );

  const prevButton =
    document.getElementById(
      "resumePrev"
    );

  const nextButton =
    document.getElementById(
      "resumeNext"
    );

  if (pageInfo) {
    pageInfo.textContent =
      `Page ${resumePageNum} / ${total}`;
  }

  if (zoomLabel) {
    zoomLabel.textContent =
      Math.round(resumeScale * 100) + "%";
  }

  if (prevButton) {
    prevButton.disabled =
      !resumePdfDoc ||
      resumePageNum <= 1;
  }

  if (nextButton) {
    nextButton.disabled =
      !resumePdfDoc ||
      resumePageNum >= total;
  }
}


/* ===== PREVIOUS PAGE ===== */

function resumePrevPage() {

  if (
    resumePdfDoc &&
    resumePageNum > 1
  ) {

    resumePageNum--;

    renderResumePage(
      resumePageNum
    );
  }
}


/* ===== NEXT PAGE ===== */

function resumeNextPage() {

  if (
    resumePdfDoc &&
    resumePageNum <
      resumePdfDoc.numPages
  ) {

    resumePageNum++;

    renderResumePage(
      resumePageNum
    );
  }
}


/* ===== ZOOM IN ===== */

function resumeZoomIn() {

  if (!resumePdfDoc) return;

  resumeScale =
    Math.min(
      resumeScale * 1.15,
      4
    );

  renderResumePage(
    resumePageNum
  );
}


/* ===== ZOOM OUT ===== */

function resumeZoomOut() {

  if (!resumePdfDoc) return;

  resumeScale =
    Math.max(
      resumeScale / 1.15,
      0.35
    );

  renderResumePage(
    resumePageNum
  );
}


/* ===== FIT PAGE ===== */

async function resumeFitPage() {

  if (!resumePdfDoc) return;

  resumeScale =
    await getResumeFitScale(
      resumePageNum
    );

  renderResumePage(
    resumePageNum
  );
}


/* ===== LOADING ===== */

function showResumeLoading(show) {

  const loading =
    document.getElementById(
      "resumeLoading"
    );

  if (loading) {
    loading.classList.toggle(
      "hidden",
      !show
    );
  }
}


/* ===== ERROR ===== */

function showResumeError(show) {

  const error =
    document.getElementById(
      "resumeError"
    );

  if (error) {
    error.classList.toggle(
      "open",
      show
    );
  }
}


/* ===== CLOSE RESUME ===== */

function closeResume(event) {

  if (
    event &&
    event.target &&
    event.target.id !==
      "resumeModal"
  ) {
    return;
  }

  const modal =
    document.getElementById(
      "resumeModal"
    );

  if (modal) {
    modal.classList.remove(
      "open"
    );
  }

  if (resumeRenderTask) {

    try {
      resumeRenderTask.cancel();
    } catch (e) {}

  }

  resumeRenderTask = null;
  resumePdfDoc = null;

  const canvas =
    document.getElementById(
      "resumeCanvas"
    );

  if (canvas) {

    canvas.width = 1;
    canvas.height = 1;

    canvas.style.width = "1px";
    canvas.style.height = "1px";
  }

  document.body.style.overflow = "";
}


/* ===== RESUME PROTECTION ===== */

const resumeModal =
  document.getElementById(
    "resumeModal"
  );

if (resumeModal) {

  resumeModal.addEventListener(
    "contextmenu",
    function (event) {
      event.preventDefault();
    }
  );
}


document.addEventListener(
  "keydown",
  function (event) {

    const modal =
      document.getElementById(
        "resumeModal"
      );

    if (
      !modal ||
      !modal.classList.contains(
        "open"
      )
    ) {
      return;
    }

    /* Block Print, Save and View Source
       while Resume viewer is open */

    if (
      (event.ctrlKey ||
        event.metaKey) &&
      ["p", "s", "u"].includes(
        event.key.toLowerCase()
      )
    ) {
      event.preventDefault();
    }

    /* Escape closes viewer */

    if (event.key === "Escape") {
      closeResume();
    }
  }
);


/* ===== RESIZE ===== */

window.addEventListener(
  "resize",
  function () {

    const modal =
      document.getElementById(
        "resumeModal"
      );

    if (
      resumePdfDoc &&
      modal &&
      modal.classList.contains(
        "open"
      )
    ) {

      resumeFitPage();
    }
  }
);


function openIntroVideo() {
  const modal = document.getElementById("introVideoModal");
  const video = document.getElementById("introVideo");

  modal.classList.add("open");
  document.body.style.overflow = "hidden";

  video.pause();
  video.currentTime = 0;
  video.load();

  function startWhenReady(){
    video.currentTime = 0;
    video.play().catch(function(){});
  }

  if (video.readyState >= 1) {
    startWhenReady();
  } else {
    video.addEventListener("loadedmetadata", startWhenReady, {once:true});
  }
}

function closeIntroVideo(event) {
  if (event && event.target && event.target.id !== "introVideoModal") return;
  const modal = document.getElementById("introVideoModal");
  const video = document.getElementById("introVideo");
  video.pause();
  video.currentTime = 0;
  modal.classList.remove("open");
  document.body.style.overflow = "";
}

document.addEventListener("keydown", function(e) {
  if (e.key === "Escape") { closeResume(); closeIntroVideo(); }
});


/* ===== Scroll-triggered animations ===== */
function initScrollReveal(){
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const heroText = document.querySelector(".hero > div:first-child");
  const heroPhoto = document.querySelector(".hero > div:last-child");
  if (heroText) heroText.classList.add("hero-animate");
  if (heroPhoto) heroPhoto.classList.add("hero-photo-animate");

  document.querySelectorAll("#portfolio-content > section").forEach(function(section){
    section.classList.add("reveal");
  });

  document.querySelectorAll(".card, .stat, .skill").forEach(function(el, i){
    el.classList.add("reveal-card");
    el.style.transitionDelay = (Math.min(i % 5, 4) * 80) + "ms";
  });

  if (reduceMotion || !("IntersectionObserver" in window)) {
    document.querySelectorAll(".reveal,.reveal-card").forEach(function(el){
      el.classList.add("show");
    });
    return;
  }

  const observer = new IntersectionObserver(function(entries, obs){
    entries.forEach(function(entry){
      if (!entry.isIntersecting) return;
      entry.target.classList.add("show");
      obs.unobserve(entry.target);
    });
  }, {threshold:0.12, rootMargin:"0px 0px -45px 0px"});

  document.querySelectorAll(".reveal,.reveal-card").forEach(function(el){
    observer.observe(el);
  });
}


/* ===== LEAVE A MESSAGE POPUP ===== */
function openMessagePopup(){
  const overlay = document.getElementById("messageOverlay");
  if(!overlay) return;
  overlay.classList.add("open");
  overlay.setAttribute("aria-hidden","false");
  document.body.style.overflow="hidden";
  const firstInput = overlay.querySelector("input");
  if(firstInput) setTimeout(() => firstInput.focus(), 150);
}

function closeMessagePopup(event){
  if(event && event.target && event.target.id !== "messageOverlay") return;
  const overlay = document.getElementById("messageOverlay");
  if(!overlay) return;
  overlay.classList.remove("open");
  overlay.setAttribute("aria-hidden","true");
  document.body.style.overflow="";
}

async function submitLeaveMessage(event){
  event.preventDefault();

  const form = document.getElementById("leaveMessageForm");
  const button = form.querySelector(".message-submit");
  const originalText = button.textContent;

  button.disabled = true;
  button.textContent = "Sending...";

  try {
    const response = await fetch(form.action, {
      method: "POST",
      body: new FormData(form),
      headers: { "Accept": "application/json" }
    });

    if (response.ok) {
      button.textContent = "Message Sent ✓";

      setTimeout(function(){
        form.reset();
        button.textContent = originalText;
        button.disabled = false;
        closeMessagePopup();
      }, 1300);
    } else {
      button.textContent = "Try Again";
      button.disabled = false;
      alert("Sorry, your message could not be sent. Please try again.");
    }
  } catch (error) {
    button.textContent = "Try Again";
    button.disabled = false;
    alert("Please check your internet connection and try again.");
  }
}

document.addEventListener("keydown",function(event){
  if(event.key === "Escape") closeMessagePopup();
});

const certPdfWorker = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
if(window.pdfjsLib){ pdfjsLib.GlobalWorkerOptions.workerSrc = certPdfWorker; }

let certPdfDoc = null;
let certPageNum = 1;
let certScale = 1.0;
let certRenderTask = null;
let certCurrentFile = "";

function filterCertificates(category, button){
  document.querySelectorAll(".cert-filter").forEach(function(btn){btn.classList.remove("active");});
  button.classList.add("active");
  document.querySelectorAll(".cert-card").forEach(function(card){
    card.style.display=(category==="all"||card.dataset.certCategory===category)?"":"none";
  });
}

async function openCertificate(file,title){
  document.getElementById("certificateModalTitle").textContent=title;
  document.getElementById("certificateModal").classList.add("open");
  document.body.style.overflow="hidden";
  certCurrentFile=file;
  certPdfDoc=null;
  certPageNum=1;
  certScale=1.0;
  showCertLoading(true);
  showCertError(false);
  updateCertControls();
  try{
    if(!window.pdfjsLib) throw new Error("The PDF viewer library did not load.");
    const loadingTask=pdfjsLib.getDocument({url:file});
    certPdfDoc=await loadingTask.promise;
    certPageNum=1;
    certScale=await getFitScale(certPageNum);
    await renderCertificatePage(certPageNum);
  }catch(err){
    console.error(err);
    showCertLoading(false);
    document.getElementById("certErrorText").textContent="The PDF could not be loaded. Please check that the PDF is inside your certificates folder.";
    showCertError(true);
  }
}

async function renderCertificatePage(pageNum){
  if(!certPdfDoc)return;
  showCertLoading(true);
  if(certRenderTask){try{certRenderTask.cancel();}catch(e){}}
  try{
    const page=await certPdfDoc.getPage(pageNum);
    const viewport=page.getViewport({scale:certScale});
    const canvas=document.getElementById("certificateCanvas");
    const ctx=canvas.getContext("2d",{alpha:false});
    const dpr=Math.min(window.devicePixelRatio||1,2);
    canvas.width=Math.floor(viewport.width*dpr);
    canvas.height=Math.floor(viewport.height*dpr);
    canvas.style.width=viewport.width+"px";
    canvas.style.height=viewport.height+"px";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    certRenderTask=page.render({canvasContext:ctx,viewport:viewport});
    await certRenderTask.promise;
    certRenderTask=null;
    showCertLoading(false);
    updateCertControls();
  }catch(err){
    if(err&&err.name==="RenderingCancelledException")return;
    console.error(err);
    showCertLoading(false);
  }
}

async function getFitScale(pageNum){
  const page=await certPdfDoc.getPage(pageNum);
  const base=page.getViewport({scale:1});
  const stage=document.getElementById("certStage");
  const availableW=Math.max(stage.clientWidth-56,280);
  const availableH=Math.max(stage.clientHeight-56,280);
  return Math.min(availableW/base.width,availableH/base.height)*0.98;
}

function updateCertControls(){
  const total=certPdfDoc?certPdfDoc.numPages:1;
  document.getElementById("certPageInfo").textContent=`Page ${certPageNum} / ${total}`;
  document.getElementById("certZoomLabel").textContent=Math.round(certScale*100)+"%";
  document.getElementById("certPrev").disabled=!certPdfDoc||certPageNum<=1;
  document.getElementById("certNext").disabled=!certPdfDoc||certPageNum>=total;
}

function certPrevPage(){if(certPdfDoc&&certPageNum>1){certPageNum--;renderCertificatePage(certPageNum);}}
function certNextPage(){if(certPdfDoc&&certPageNum<certPdfDoc.numPages){certPageNum++;renderCertificatePage(certPageNum);}}
function certZoomIn(){if(!certPdfDoc)return;certScale=Math.min(certScale*1.15,4);renderCertificatePage(certPageNum);}
function certZoomOut(){if(!certPdfDoc)return;certScale=Math.max(certScale/1.15,0.35);renderCertificatePage(certPageNum);}
async function certFitPage(){if(!certPdfDoc)return;certScale=await getFitScale(certPageNum);renderCertificatePage(certPageNum);}
function showCertLoading(show){document.getElementById("certLoading").classList.toggle("hidden",!show);}
function showCertError(show){document.getElementById("certError").classList.toggle("open",show);}

function closeCertificate(event){
  if(event&&event.target&&event.target.id!=="certificateModal")return;
  document.getElementById("certificateModal").classList.remove("open");
  if(certRenderTask){try{certRenderTask.cancel();}catch(e){}}
  certRenderTask=null;
  certPdfDoc=null;
  certCurrentFile="";
  const canvas=document.getElementById("certificateCanvas");
  canvas.width=1;canvas.height=1;canvas.style.width="1px";canvas.style.height="1px";
  document.body.style.overflow="";
}

// Prevent the obvious browser actions while the certificate viewer is open.
document.getElementById("certificateModal").addEventListener("contextmenu",function(e){e.preventDefault();});
document.addEventListener("keydown",function(e){
  if(!document.getElementById("certificateModal").classList.contains("open"))return;
  if((e.ctrlKey||e.metaKey)&&["p","s","u"].includes(e.key.toLowerCase()))e.preventDefault();
  if(e.key==="Escape")closeCertificate();
});
window.addEventListener("resize",function(){if(certPdfDoc&&document.getElementById("certificateModal").classList.contains("open"))certFitPage();});
