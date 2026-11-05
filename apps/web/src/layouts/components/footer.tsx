import { Link } from "react-router";

const WAXP_ICON = (
  <svg viewBox="0 0 299 93" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M21.2858 75.4546L1 19.9441H19.5436L33.5614 57.8322L47.6993 19.6837L70.6485 19.8239L84.386 57.7121H85.0468L98.6641 19.8239H117.488L97.3024 74.8338L145.223 18.6224H168.713L204.739 60.9161L222.221 46.4978L167.652 1H195.267L283.319 74.2531H255.704L236.099 57.7121L216.354 74.2531H192.864C189.179 69.8876 181.77 61.1765 181.65 61.1765H142.84L152.573 49.7019H172.057L156.978 32.3598L106.013 91.9956H82.6638L96.7617 75.4546H72.5109L59.1739 39.569L45.837 75.4546H21.2858Z"
      fill="#FFF"
    />
    <path
      d="M1 19.9441L21.2858 75.4546H45.837L59.1739 39.569L72.5109 75.4546H97.0621L117.488 19.8239H98.6641L85.0468 57.7121H84.386L70.6485 19.8239L47.6993 19.6837L33.5614 57.8322L19.5436 19.9441H1V19.9441ZM82.6638 91.9956L145.223 18.6224H168.713L204.739 60.9161L222.221 46.4978L167.652 1H195.267L283.319 74.2531H255.704L236.099 57.7121L216.354 74.2531H192.864C189.179 69.8875 181.77 61.1765 181.65 61.1765H142.84L152.573 49.7019H172.057L156.978 32.3599L106.013 91.9956H82.6638Z"
      stroke="#000"
      fill="#FFF"
    />
    <path
      d="M255.844 42.7731L241.826 31.0181L255.163 19.8239H282.918L255.844 42.7731Z"
      fill="#FFF"
    />
    <path
      d="M291.129 20.5048H289.266V25.5712H288.025V20.5048H286.182V19.4835H291.129V20.5048ZM293.472 19.4835L295.034 23.8891L296.576 19.4835H298.218V25.5512H296.956V23.8891L297.076 21.0255L295.434 25.5512H294.573L292.931 21.0255L293.051 23.8891V25.5512H291.79V19.4835H293.472Z"
      fill="#FFF"
    />
  </svg>
);

const X_ICON = (
  <svg
    id="Capa_1"
    viewBox="0 0 1226.37 1226.37"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="m727.348 519.284 446.727-519.284h-105.86l-387.893 450.887-309.809-450.887h-357.328l468.492 681.821-468.492 544.549h105.866l409.625-476.152 327.181 476.152h357.328l-485.863-707.086zm-144.998 168.544-47.468-67.894-377.686-540.24h162.604l304.797 435.991 47.468 67.894 396.2 566.721h-162.604l-323.311-462.446z" />
  </svg>
);

const DISCORD_ICON = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    version="1.1"
    id="Capa_1"
    x="0px"
    y="0px"
    viewBox="0 0 512 512"
  >
    <g>
      <path d="M433.43,93.222c-32.633-14.973-67.627-26.005-104.216-32.324c-0.666-0.122-1.332,0.183-1.675,0.792   c-4.501,8.005-9.486,18.447-12.977,26.655c-39.353-5.892-78.505-5.892-117.051,0c-3.492-8.39-8.658-18.65-13.179-26.655   c-0.343-0.589-1.009-0.894-1.675-0.792c-36.568,6.298-71.562,17.33-104.216,32.324c-0.283,0.122-0.525,0.325-0.686,0.589   c-66.376,99.165-84.56,195.893-75.64,291.421c0.04,0.467,0.303,0.914,0.666,1.198c43.793,32.161,86.215,51.685,127.848,64.627   c0.666,0.203,1.372-0.04,1.796-0.589c9.848-13.449,18.627-27.63,26.154-42.543c0.444-0.873,0.02-1.909-0.888-2.255   c-13.925-5.282-27.184-11.723-39.939-19.036c-1.009-0.589-1.09-2.032-0.161-2.723c2.684-2.011,5.369-4.104,7.932-6.217   c0.464-0.386,1.11-0.467,1.655-0.224c83.792,38.257,174.507,38.257,257.31,0c0.545-0.264,1.191-0.182,1.675,0.203   c2.564,2.113,5.248,4.226,7.952,6.237c0.928,0.691,0.867,2.134-0.141,2.723c-12.755,7.456-26.014,13.754-39.959,19.016   c-0.908,0.345-1.312,1.402-0.867,2.275c7.689,14.892,16.468,29.073,26.134,42.523c0.404,0.569,1.13,0.813,1.796,0.609   c41.835-12.941,84.257-32.466,128.05-64.627c0.384-0.284,0.626-0.711,0.666-1.178c10.676-110.441-17.881-206.376-75.7-291.421   C433.954,93.547,433.712,93.344,433.43,93.222z M171.094,327.065c-25.227,0-46.014-23.16-46.014-51.604   s20.383-51.604,46.014-51.604c25.831,0,46.417,23.364,46.013,51.604C217.107,303.905,196.723,327.065,171.094,327.065z    M341.221,327.065c-25.226,0-46.013-23.16-46.013-51.604s20.383-51.604,46.013-51.604c25.832,0,46.417,23.364,46.014,51.604   C387.235,303.905,367.054,327.065,341.221,327.065z" />
    </g>
  </svg>
);

const MEDIUM_ICON = (
  <svg id="Bold" enableBackground="new 0 0 24 24" viewBox="0 0 24 24">
    <path d="m22.085 4.733 1.915-1.832v-.401h-6.634l-4.728 11.768-5.379-11.768h-6.956v.401l2.237 2.693c.218.199.332.49.303.783v10.583c.069.381-.055.773-.323 1.05l-2.52 3.054v.396h7.145v-.401l-2.52-3.049c-.273-.278-.402-.663-.347-1.05v-9.154l6.272 13.659h.729l5.393-13.659v10.881c0 .287 0 .346-.188.534l-1.94 1.877v.402h9.412v-.401l-1.87-1.831c-.164-.124-.249-.332-.214-.534v-13.467c-.035-.203.049-.411.213-.534z" />
  </svg>
);

const TELEGRAM_ICON = (
  <svg id="Bold" enableBackground="new 0 0 24 24" viewBox="0 0 24 24">
    <path d="m9.417 15.181-.397 5.584c.568 0 .814-.244 1.109-.537l2.663-2.545 5.518 4.041c1.012.564 1.725.267 1.998-.931l3.622-16.972.001-.001c.321-1.496-.541-2.081-1.527-1.714l-21.29 8.151c-1.453.564-1.431 1.374-.247 1.741l5.443 1.693 12.643-7.911c.595-.394 1.136-.176.691.218z" />
  </svg>
);

const YOUTUBE_ICON = (
  <svg version="1.1" id="Layer_1" viewBox="0 0 310 310">
    <g id="XMLID_822_">
      <path
        id="XMLID_823_"
        d="M297.917,64.645c-11.19-13.302-31.85-18.728-71.306-18.728H83.386c-40.359,0-61.369,5.776-72.517,19.938
		C0,79.663,0,100.008,0,128.166v53.669c0,54.551,12.896,82.248,83.386,82.248h143.226c34.216,0,53.176-4.788,65.442-16.527
		C304.633,235.518,310,215.863,310,181.835v-53.669C310,98.471,309.159,78.006,297.917,64.645z M199.021,162.41l-65.038,33.991
		c-1.454,0.76-3.044,1.137-4.632,1.137c-1.798,0-3.592-0.484-5.181-1.446c-2.992-1.813-4.819-5.056-4.819-8.554v-67.764
		c0-3.492,1.822-6.732,4.808-8.546c2.987-1.814,6.702-1.938,9.801-0.328l65.038,33.772c3.309,1.718,5.387,5.134,5.392,8.861
		C204.394,157.263,202.325,160.684,199.021,162.41z"
      />
    </g>
  </svg>
);

const Footer = () => {
  // Dynamically get the current year
  const currentYear = new Date().getFullYear();

  return (
    <>
      <footer className="footer">
        <div className="wrapper">
          <div className="footer_top">
            <div className="footer_icon">
              <Link to="/" className="footer_logo">
                {WAXP_ICON}
              </Link>
              <ul className="social_icons">
                <li>
                  <a
                    className="X"
                    href="https://x.com/WAX_io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {X_ICON}
                  </a>
                </li>
                <li>
                  <a
                    className="discord"
                    href="https://discord.com/invite/dJtPetMdfb"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {DISCORD_ICON}
                  </a>
                </li>
                <li>
                  <a
                    className="medium"
                    href="https://wax-io.medium.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {MEDIUM_ICON}
                  </a>
                </li>
              </ul>
              <ul className="social_icons">
                <li>
                  <a
                    className="telegram"
                    href="https://t.me/wax_io"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {TELEGRAM_ICON}
                  </a>
                </li>
                <li>
                  <a
                    className="youtube"
                    href="https://www.youtube.com/channel/UCQPwMpYKMDiudnw41QwliHQ"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {YOUTUBE_ICON}
                  </a>
                </li>
              </ul>
            </div>
            <div className="footer_content">
              <div className="cont_col">
                <h3>RESOURCES</h3>
                <ul className="nav">
                  <li>
                    <a
                      href="https://www.wax.io/terms/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Terms
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.wax.io/privacy-policy/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Privacy
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://github.com/worldwide-asset-exchange/whitepaper"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Whitepaper
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://eosauthority.com/wax_green/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Carbon Neutrality
                    </a>
                  </li>
                </ul>
              </div>
              <div className="cont_col">
                <h3>COMMUNITY</h3>
                <ul className="nav">
                  <li>
                    <a
                      href="https://discord.com/invite/dJtPetMdfb"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Join the Community
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://wax-io.medium.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Blog
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://form.typeform.com/to/rlcRWmsq"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Partnerships
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.wax.io/branding/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Branding
                    </a>
                  </li>
                </ul>
              </div>
              <div className="cont_col">
                <h3>BLOCKCHAIN</h3>
                <ul className="nav">
                  <li>
                    <a
                      href="https://waxblock.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WAX Explorer
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://labs.wax.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WAX Labs
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.mycloudwallet.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      My Cloud Wallet
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://bridge.mycloudwallet.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Bridge
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://status.wax.io/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Status
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://waxblock.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WAX Mainnet
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://testnet.waxblock.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      WAX Testnet
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://local.waxblock.io"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Local Testnet
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer_bottom">
            <div className="copyright">
              <p>
                © {currentYear} WAX, Worldwide Asset eXchange™ All rights
                reserved
              </p>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
};

export default Footer;
