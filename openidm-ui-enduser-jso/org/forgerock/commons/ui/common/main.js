"use strict";

/*
 * Copyright 2011-2017 ForgeRock AS. All Rights Reserved
 *
 * Use of this code requires a commercial software license with ForgeRock AS.
 * or with one of its affiliates. All use shall be exclusively subject
 * to such license between the licensee and ForgeRock AS.
 */

// this module is merely a useful construct for identifying
// top-level modules which would be likely to need to embed
// within a single minified package, since they are pretty much
// always needed (even for the simplest of forgerock-ui apps)
define("org/forgerock/commons/ui/common/main", ["./main/AbstractView", "./components/BootstrapDialogView", "./main/ErrorsHandler", "./components/Footer", "./main/i18nManager", "./components/Messages", "./components/Navigation", "./main/ProcessConfiguration", "./main/Router", "./main/SessionManager", "./main/SpinnerManager", "./SiteConfigurator"]);
