//<span class="cmdIcon fa-solid fa-ellipsis-vertical"></span>
let contentScrollPosition = 0;
let selectedCat = "";
let IsAllSelected = false;
Init_UI();

function Init_UI() {
    renderBookmarks();
    $('#createBookmark').on("click", async function () {
        saveContentScrollPosition();
        renderCreateBookmarkForm();
    });
    $('#abort').on("click", async function () {
        renderBookmarks();
    });
    $('#aboutCmd').on("click", function () {
        renderAbout();
    });
}

function renderAbout() {
    saveContentScrollPosition();
    eraseContent();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("À propos...");
    $("#content").append(
        $(`
            <div class="aboutContainer">
                <h2>Gestionnaire des favoris</h2>
                <hr>
                <p>
                    Laboratoire 1 d'un site en SPA connecté avec un serveur Javascript
                </p>
                <p>
                    Auteur: Philippe Robichaud-Gionet
                </p>
                <p>
                    Collège Lionel-Groulx, automne 2024
                </p>
            </div>
        `))
}

async function renderBookmarks() {
    showWaitingGif();
    $("#actionTitle").text("Liste des favoris");
    $("#createBookmark").show();
    $("#abort").hide();
    let bookmarks = await API_GetBookmarks();
    eraseContent();

    if (bookmarks !== null) {
        bookmarks.forEach(bookmark => {
            if (selectedCat == bookmark.Category || IsAllSelected){
                $("#content").append(renderBookmark(bookmark));
            }
        });
        restoreContentScrollPosition();
        // Attached click events on command icons
        $(".editCmd").on("click", function () {
            saveContentScrollPosition();
            renderEditBookmarkForm(parseInt($(this).attr("editbookmarkId")));
        });
        $(".deleteCmd").on("click", function () {
            saveContentScrollPosition();
            renderDeleteBookmarkForm(parseInt($(this).attr("deletebookmarkId")));
        });
        $(".bookmarkRow").on("click", function (e) { e.preventDefault(); })
    } else {
        renderError("Service introuvable");
    }
}

function showWaitingGif() {
    $("#content").empty();
    $("#content").append($("<div class='waitingGifcontainer'><img class='waitingGif' src='https://cdn.glitch.global/4ff21dc0-66cc-4f8a-826c-d2408eee0db1/Loading_icon.gif?v=1726590171481' /></div>'"));
}

function eraseContent() {
    $("#content").empty();
}

function saveContentScrollPosition() {
    contentScrollPosition = $("#content")[0].scrollTop;
}

function restoreContentScrollPosition() {
    $("#content")[0].scrollTop = contentScrollPosition;
}

function renderError(message) {
    eraseContent();
    $("#content").append(
        $(`
            <div class="errorContainer">
                ${message}
            </div>
        `)
    );
}

function renderCreateBookmarkForm() {
    renderBookmarkForm();
}

async function renderEditBookmarkForm(id) {
    showWaitingGif();
    let bookmark = await API_GetBookmark(id);
    if (bookmark !== null)
        renderBookmarkForm(bookmark);
    else
        renderError("favoris introuvable!");
}

async function renderDeleteBookmarkForm(id) {
    showWaitingGif();
    $("#createBookmark").hide();
    $("#abort").show();
    $("#actionTitle").text("Retrait");
    let bookmark = await API_GetBookmark(id);
    eraseContent();
    if (bookmark !== null) {
        $("#content").append(`
        <div class="bookmarkdeleteForm">
            <h4>Effacer le contact suivant?</h4>
            <br>
            <div class="bookmarkRow" bookmark_id="${bookmark.Id}">
                <div class="bookmarkContainer">
                    <div class="bookmarkLayout">
                        <div style='display:flex;'>
                            <span style='margin-right: 10px;'><a href='${bookmark.Url}'><img src='http://www.google.com/s2/favicons?sz=32&domain=${bookmark.Url}' width='28px'/></a></span>
                            <span class="bookmarkTitre">${bookmark.Title}</span>
                        </div>
                        <span class="bookmarkCategorie">${bookmark.Category}</span>
                    </div>
                </div>  
            </div>   
            <br>
            <input type="button" value="Effacer" id="deletebookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </div>    
        `);
        $('#deletebookmark').on("click", async function () {
            showWaitingGif();
            let result = await API_DeleteBookmarks(bookmark.Id);
            if (result)
                renderBookmark();
            else
                renderError("Une erreur est survenue!");
        });
        $('#cancel').on("click", function () {
            renderBookmark();
        });
    } else {
        renderError("Contact introuvable!");
    }
}

function newBookmark() {
    let bookmark = {};
    bookmark.Id = 0;
    bookmark.Title = "";
    bookmark.Url = "";
    bookmark.Category = "";
    return bookmark;
}

function renderBookmarkForm(bookmark = null) {
    $("#createBookmark").hide();
    $("#abort").show();
    eraseContent();
    let create = bookmark == null;
    if (create) bookmark = newBookmark();
    $("#actionTitle").text(create ? "Création" : "Modification");
    $("#content").append(`
        <form class="form" id="bookmarkForm">
            <input type="hidden" name="Id" value="${bookmark.Id}"/>

            <label for="Title" class="form-label">Titre </label>
            <input 
                class="form-control Alpha"
                name="Title" 
                id="Title" 
                placeholder="Titre"
                required
                RequireMessage="Veuillez entrer un titre"
                InvalidMessage="Le titre comporte un caractère illégal" 
                value="${bookmark.Title}"
            />
            <label for="Url" class="form-label">Url </label>
            <input
                class="form-control URL"
                name="Url"
                id="Url"
                placeholder="Veuillez entrer un Url"
                required
                RequireMessage="Veuillez entrer un Url" 
                InvalidMessage="Veuillez entrer un Url valide"
                value="${bookmark.Url}" 
            />
            <label for="Category" class="form-label">Catégorie </label>
            <input 
                class="form-control"
                name="Category"
                id="Category"
                placeholder="Catégorie"
                required
                RequireMessage="Veuillez entrer votre Catégorie" 
                InvalidMessage="Veuillez entrer une Catégorie valide"
                value="${bookmark.Category}"
            />
            <hr>
            <input type="submit" value="Enregistrer" id="saveBookmark" class="btn btn-primary">
            <input type="button" value="Annuler" id="cancel" class="btn btn-secondary">
        </form>
    `);
    initFormValidation();
    $('#bookmarkForm').on("submit", async function (event) {
        event.preventDefault();
        let bookmark = getFormData($("#bookmarkForm"));
        bookmark.Id = parseInt(bookmark.Id);
        showWaitingGif();
        let result = await API_SaveBookmark(bookmark, create);
        if (result)
            renderBookmarks();
        else
            renderError("Une erreur est survenue!");
    });
    $('#cancel').on("click", function () {
        renderBookmarks();
    });
}

function getFormData($form) {
    const removeTag = new RegExp("(<[a-zA-Z0-9]+>)|(</[a-zA-Z0-9]+>)", "g");
    var jsonObject = {};
    $.each($form.serializeArray(), (index, control) => {
        jsonObject[control.name] = control.value.replace(removeTag, "");
    });
    return jsonObject;
}

function renderBookmark(bookmark) {
    return $(`
     <div class="bookmarkRow" bookmark_id=${bookmark.Id}">
        <div class="bookmarkContainer noselect">
            <div class="bookmarkLayout">
                <div style='display:flex;'>
                    <span style='margin-right: 10px;'><a href='${bookmark.Url}'><img src='http://www.google.com/s2/favicons?sz=32&domain=${bookmark.Url}' width='28px'/></a></span>
                    <span class="bookmarkTitre">${bookmark.Title}</span>
                </div>
                <span class="bookmarkCategorie">${bookmark.Category}</span>
            </div>
            <div class="bookmarkCommandPanel">
                <span class="editCmd cmdIcon fa fa-pencil" editbookmarkId="${bookmark.Id}" title="Modifier ${bookmark.Title}"></span>
                <span class="deleteCmd cmdIcon fa fa-trash" deletebookmarkId="${bookmark.Id}" title="Effacer ${bookmark.Title}"></span>
            </div>
        </div>
    </div>           
    `);
}

$('.dropdown-item').on("click", function () {
               
});
async function renderCategory(){
    let bookmarks = await API_GetBookmarks();
}