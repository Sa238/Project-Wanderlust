const User = require("../models/user");

module.exports.renderSignupForm = (req, res) => {
    res.render("./users/signup.ejs");
};

module.exports.signup = async(req, res) => {
    try { 
    let{username, email, password} = req.body;
    const newUser = new User({email, username});
    const registeredUser = await User.register(newUser, password);
    console.log(registeredUser);
    req.login(registeredUser, (err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "Welcome to Wanderlust");
        // res.redirect("/listings");
        res.redirect("/login");
    });  
    } catch(e) {
        req.flash("error", e.message);
        res.redirect("/signup");
    }
};

module.exports.renderLoginForm = (req, res) => {
    res.render("./users/login.ejs");
};

module.exports.login = async(req, res) => {
    req.flash("success", "Welcome back to wanderlust!");
    let redirectUrl = res.locals.redirectUrl || "/listings";
    res.redirect(redirectUrl);
};

module.exports.logout = (req, res, next) => {
    req.logout((err) => {
        if(err) {
            return next();
        }
        req.flash("success", "you are logged out!");
        res.redirect("/listings");
    });
};


module.exports.renderProfileForm = async (req, res) => {
    try {
        const currUser = await User.findById(req.user._id);
        if (!currUser) {
            req.flash('error', 'User not found');
            return res.redirect('/listings');
        }
        
        console.log("User data:", currUser);
        
        res.render("./users/profile.ejs", { 
            currUser,
            memberSince: currUser.createdAt ? currUser.createdAt.toLocaleDateString() : 'Unknown date'
        });
    } catch (e) {
        req.flash('error', 'Error loading profile');
        res.redirect('/listings');
    }
};
module.exports.showProfile = async (req, res) => {
    console.log(req);
    try {
        const currUser = req.user;
        console.log("Current User Data=======>", currUser);
        res.redirect("/profile", { currUser });
    } catch (e) {
        req.flash('error', 'Error fetching profile');
        res.redirect('/listings');
    }
};

module.exports.renderEditForm = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect("/profile");
        }
        res.render("users/edit.ejs", { user });
    } catch (e) {
        req.flash('error', 'Error loading edit form');
        res.redirect('/profile');
    }
};

module.exports.updateUsers = async (req, res) => {
    try {
        const { username, email } = req.body;
        const user = await User.findByIdAndUpdate(
            req.user._id,
            { username, email },
            { new: true, runValidators: true }
        );
        
        if (!user) {
            req.flash("error", "User not found!");
            return res.redirect("/profile");
        }
        
        req.flash("success", "Profile updated successfully!");
        res.redirect("/profile");
    } catch (e) {
        req.flash("error", e.message);
        res.redirect("/profile/edit");
    }
};
