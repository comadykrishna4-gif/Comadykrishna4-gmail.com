
document.addEventListener("DOMContentLoaded", function () {

    // Current Year
    const year = document.getElementById("year");

    if (year) {
        year.textContent = new Date().getFullYear();
    }

    // Mobile Menu
    const menuButton = document.querySelector(".toggle");
    const navigation = document.querySelector("nav");

    if (menuButton && navigation) {
        menuButton.addEventListener("click", function () {
            navigation.classList.toggle("show");
        });
    }

    // Load Website Messages
    async function loadMessages() {

        try {
            const response = await fetch("/api/content");
            const data = await response.json();

            if (data.success && data.content) {

                Object.entries(data.content).forEach(function ([id, value]) {

                    const element = document.getElementById(id);

                    if (element && typeof value === "string") {
                        element.textContent = value;
                    }

                });

            }

        } catch (error) {
            console.log("Website messages could not load.");
        }

    }

    loadMessages();

    // Gallery Loading
    async function loadGallery() {

        const gallery = document.getElementById("publicGallery");
        const status = document.getElementById("galleryStatus");

        if (!gallery) return;

        try {

            const response = await fetch("/api/gallery");
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error("Gallery unavailable");
            }

            gallery.innerHTML = "";

            (data.items || []).forEach(function (item) {

                if (item.type === "video") {

                    const video = document.createElement("video");
                    video.src = item.url;
                    video.controls = true;
                    video.loading = "lazy";
                    gallery.appendChild(video);

                } else {

                    const image = document.createElement("img");
                    image.src = item.url;
                    image.alt = "Vaswan Films Gallery";
                    image.loading = "lazy";
                    gallery.appendChild(image);

                }

            });

            if (status) {
                status.textContent =
                    data.items && data.items.length
                    ? ""
                    : "Gallery coming soon.";
            }

        } catch (error) {

            if (status) {
                status.textContent = "Gallery is temporarily unavailable.";
            }

        }

    }

    loadGallery();

    // Contact and Artist Forms
    function setupEmailForm(formId, statusId, subject) {

        const form = document.getElementById(formId);

        if (!form) return;

        form.addEventListener("submit", function (event) {

            event.preventDefault();

            if (!form.reportValidity()) return;

            let message = "";

            new FormData(form).forEach(function (value, key) {

                message += key + ": " + value + "\n";

            });

            const email =
                "Vaswankrishna@gmail.com";

            const mailLink =
                "mailto:" + email +
                "?subject=" + encodeURIComponent(subject) +
                "&body=" + encodeURIComponent(message);

            const status =
                document.getElementById(statusId);

            if (status) {
                status.textContent =
                    "Please send the email from your email app.";
            }

            window.location.href = mailLink;

        });

    }

    setupEmailForm(
        "artistForm",
        "artistStatus",
        "Vaswan Films Artist Registration"
    );

    setupEmailForm(
        "contactForm",
        "contactStatus",
        "Vaswan Films Business Enquiry"
    );

});
