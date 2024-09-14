const express = require("express");
const router = express.Router();
const Listing = require("../models/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const {isLoggedIn , isOwner, validateListing} = require("../middleware.js");
const listingControllers = require("../controllers/listings.js");
const multer  = require('multer')
const { storage } = require("../cloudConfig.js");
const upload = multer({ storage });

  
router
.route("/")
.get(wrapAsync(listingControllers.index))
.post(isLoggedIn, 
    upload.single("listing[image]"), 
    wrapAsync(listingControllers.createListing)
);

 //New Route
 router.get("/new", isLoggedIn ,listingControllers.renderNewForm);

router
.route("/:id")
.get(wrapAsync(listingControllers.showListing))
.put(isLoggedIn,isOwner , 
    upload.single("listing[image]"), 
    wrapAsync(listingControllers.updateListing))
.delete(isLoggedIn, isOwner ,
    wrapAsync(listingControllers.deleteListing)
);

    // Edit route
    router.get("/:id/edit", isLoggedIn, isOwner,  wrapAsync(listingControllers.renderEditForm));


    module.exports = router;