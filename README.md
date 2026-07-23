# Contact Center Skills Widget

Hosts a widget which will function inside of Contact Center Agent Desktop that allows a Webex CC agent to switch their individual **Skill Profile** assignment.

Agents select from pre-configured skill profiles. The widget updates only the logged-in agent's user record (`skillProfileId`) and does **not** modify shared skill profile definitions (which would affect other agents).

## Developer Documentation

**https://developer.webex-cx.com/documentation/guides/desktop**  
**https://developer.webex.com/webex-contact-center/docs/api/v1/skill-profile**  
**https://developer.webex.com/webex-contact-center/docs/api/v1/users**

## Getting Started

- Clone this repository:
- ```git clone https://github.com/wxsd-sales/cc-skills-widget.git```

The widget can be hosted locally for testing on the same machine as the agent desktop. However, you will want to deploy this to a webserver with an SSL certificate when going live.

To understand how to interact with our Desktop Layout, please watch the video and supplemental detailed documentation @ **[Desktop Layout - Administration Guide](https://www.cisco.com/c/en/us/td/docs/voice_ip_comm/cust_contact/contact_center/webexcc/SetupandAdministrationGuide_2/b_mp-release-2/b_cc-release-2_chapter_011.html#topic_8230815F4023699032326F948C3F1495)**

## Installation

### 1. Setting up the Webex Service App

This widget uses a **Service App** on the backend to perform configuration writes. The Agent Desktop token available to widgets is read-only (`cjp:config_read`) and cannot update skill assignments directly.

* a. [Create a new Webex Service App](https://developer.webex.com/create/docs/service-apps)
  * i. Use a dedicated service account (for example `skills-widget@yourorg.com`) with appropriate Contact Center admin permissions.
  * ii. You can give it any name ("Contact Center Skills Widget") and any 512x512 icon.
* b. Complete the Service App authorization flow and obtain a **refresh token**.
* c. The scopes selected must include at minimum:
  * ```cjp:config_read```
  * ```cjp:config_write```
* d. Save the `client_id`, `client_secret`, and `refresh_token` for the next step.

### 2. Setting up the .env file

- a. Inside this project's root folder, rename the file ```.env.example``` to ```.env```
- b. In a text editor, open the ```.env```
- c. Choose a ```PORT``` or use ```PORT=5000``` if you are not sure what to use.
- d. Paste the Service App values to the right of the ```=``` for ```CLIENT_ID=```, ```CLIENT_SECRET=```, and ```REFRESH_TOKEN=```.
- e. Set ```WXCC_ORG_ID=``` to your Webex Contact Center organization ID.
- f. Paste your base url for your server between the double quotes of ```HOST_URI=""```. For examples:
  - i. ```HOST_URI="http://localhost:5000"```
  - ii. ```HOST_URI="https://your.server.com"```

### 3.a. Running the widget webserver as a container (Docker) (recommended)

- If you prefer to run this through ```npm```, skip this step and proceed to 3.b.
- Otherwise, run the following commands from the terminal inside your project's root directory:
- `docker build -t cc-skills-widget .`
- `docker run -p 5000:5000 -i -t cc-skills-widget`
  - replace `5000` in both places with the ```PORT``` used in your `.env` file.

### 3.b. Running the widget webserver (npm)

_Node.js version >= 14.5 must be installed on the system in order to run this through npm._

- It is recommended that you run this as a container (step 3.a.).
- If you do not wish to run the webserver as a container (Docker), proceed with this step:
- Inside this project on your terminal type: `npm install`
- Then inside this project on your terminal type: `npm run build`
- Then inside this project on your terminal type: `npm run dev`
- This should run the app on your ```PORT``` (from .env file)

### 4. Wire Up the Widget to the Layout:

- You must replace the url on line 108 of the **_skillsWidget.json_** file with your correct server endpoint. For examples:
  - "script": "http://localhost:5000/build/bundle.js",
  - "script": "https://your.webserver.com/build/bundle.js",
- This should be based on the ```HOST_URI``` in your .env file + ```/build/bundle.js```.

- Upload the **_skillsWidget.json_** file onto your Administration Portal **[WebexCC Portal - US](https://portal.wxcc-us1.cisco.com/portal/home.html#)**
  - _link above is referencing the US portal link please change if you are in different geo (us1, eu1, eu2, anz1)_
  - Note that Layouts are configured per Agent Team.
- Log in to your agent and select the right Team to view the new layout.

**Additional Improvements:**

- You can modify the widget as required.
- To create a new compiled JS file, using `npm run build` which will create the new compiled JS under `build/bundle.js`.
- You may rename this file, host it on your server of choice, and use this as the widget `src` parameter in the layout.
- Optional Python API exploration scripts are in the `scripts/` folder (see `scripts/README.md`).

## License

All contents are licensed under the MIT license. Please see [license](LICENSE) for details.

## Disclaimer

<!-- Keep the following here -->  
Everything included is for demo and Proof of Concept purposes only. Use of the site is solely at your own risk. This site may contain links to third party content, which we do not warrant, endorse, or assume liability for. These demos are for Cisco Webex usecases, but are not Official Cisco Webex Branded demos.


## Support

Please contact the Webex SD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=CCSkillsWidget) for questions. Or for Cisco internal, reach out to us on Webex App via our bot globalexpert@webex.bot & choose "Engagement Type: API/SDK Proof of Concept Integration Development".
