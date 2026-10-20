export const pageConfig: Record<
  string,
  {
    title: string;
    description: string;
  }
> = {
  "/": {
    title: "Dashboard Overview",
    description:
      "Welcome back! Here's what's happening in valoura travel today.",
  },

  "/genre": {
    title: "Genres",
    description: "Manage music genres in your library",
  },
  "/artists-management": {
    title: "Artists Management",
    description: "Manage artists and their music catalog",
  },
  "/albums-management": {
    title: "Albums Management",
    description: "Manage albums in your music library",
  },
  "/songs-management": {
    title: "Songs Management",
    description: "Manage songs in your music library",
  },
  "/playlists-management": {
    title: "Playlists Management",
    description: "Manage curated and user-created playlists",
  },

  "/payments": {
    title: "Payments",
    description:
      "Welcome back! Here's what's happening in valoura travel today.",
  },

  "/visa-applications": {
    title: "Visa Applications",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },

  "/visa-applications/add-visa": {
    title: "Add Visa Applications",
    description: "Manage pricing tiers and subscription plans",
  },

  "/student-applications": {
    title: "Student Applications",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
  "/student-applications/add": {
    title: "Add Student Applications",
    description: "Manage pricing tiers and subscription plans",
  },
   "/tour-booking": {
    title: "Tour Booking",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
  "/tour-booking/add": {
    title: "Add Tour Booking",
    description: "Manage pricing tiers and subscription plans",
  },
   "/consultation": {
    title: "Consultation",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
  "/consultation/add": {
    title: "Add Consultation",
    description: "Manage pricing tiers and subscription plans",
  },
  "/users-management": {
    title: "Users Management",
    description: "Manage user accounts and permissions",
  },
   "/countries": {
    title: "Countries",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
   "/countries/add": {
    title: "Add Country",
    description: "Manage pricing tiers and subscription plans",
  },

  "/visa-types": {
    title: "Visa Types",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
   "/visa-types/add": {
    title: "Add Visa Type",
    description: "Manage pricing tiers and subscription plans",
  },

   "/universities": {
    title: "Universities",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
   "/universities/add": {
    title: "Add University",
    description: "Manage pricing tiers and subscription plans",
  },

  "/programs": {
    title: "Programs",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
   "/programs/add": {
    title: "Add Program",
    description: "Manage pricing tiers and subscription plans",
  },

   "/tour-packages": {
    title: "Tour Packages",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
   "/tour-packages/add": {
    title: "Add Tour Package",
    description: "Manage pricing tiers and subscription plans",
  },

     "/blog-management": {
    title: "Blog Management",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
   "/blog-management/add": {
    title: "Add Blog Post",
    description: "Manage pricing tiers and subscription plans",
  },

      "/newsletter": {
    title: "Newsletter",
    description: "Welcome back! Here's what's happening in valoura travel today.",
  },
      "/settings": {
    title: "Settings",
    description: "Manage your account settings",
  },
   "/settings/profile": {
    title: "Profile Settings",
    description: "Manage your profile information",
  },
   "/settings/password": {
    title: "Password Settings",
    description: "Manage your password information",
  },
};

export const getPageConfig = (pathname: string) => {
  // Dynamic Routes
  if (pathname.startsWith("/visa-applications/edit-visa/")) {
    return {
      title: "Edit Visa Application",
      description: "Update visa application details",
    };
  }

  if (pathname.startsWith("/student-applications/edit/")) {
    return {
      title: "Edit Student Application",
      description: "Update student application details",
    };
  }

  if (pathname.startsWith("/tour-booking/edit/")) {
    return {
      title: "Edit Tour Booking",
      description: "Update tour booking details",
    };
  }

  if (pathname.startsWith("/consultation/edit/")) {
    return {
      title: "Edit Consultation",
      description: "Update consultation details",
    };
  }

   if (pathname.startsWith("/countries/edit/")) {
    return {
      title: "Edit Country",
      description: "Update country details",
    };
  }

  if (pathname.startsWith("/visa-types/edit/")) {
    return {
      title: "Edit Visa Type",
      description: "Update visa type details",
    };
  }

    if (pathname.startsWith("/universities/edit/")) {
    return {
      title: "Edit University",
      description: "Update university details",
    };
  }

  if (pathname.startsWith("/programs/edit/")) {
    return {
      title: "Edit Program",
      description: "Update program details",
    };
  }

    if (pathname.startsWith("/tour-packages/edit/")) {
    return {
      title: "Edit Tour Package",
      description: "Update tour package details",
    };
  }

  if (pathname.startsWith("/blog-management/edit/")) {
    return {
      title: "Edit Blog Post",
      description: "Update blog post details",
    };
  }

  return (
    pageConfig[pathname] || {
      title: "Dashboard",
      description: "Welcome back",
    }
  );
};
