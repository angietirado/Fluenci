import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const PrivacyPolicyPage = () => {
    const navigate = useNavigate();

    return (
        <div style={{ 
            minHeight: '100vh', 
            backgroundColor: '#f8f9fa',
            padding: '20px'
        }}>
            <div style={{ 
                maxWidth: '900px', 
                margin: '0 auto',
                backgroundColor: '#fff',
                padding: '40px',
                borderRadius: '8px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
                {/* Back Button */}
                <button
                    onClick={() => navigate(-1)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        marginBottom: '30px',
                        padding: '8px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid #ddd',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: '#333',
                        fontSize: '14px'
                    }}
                    onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f5f5f5';
                    }}
                    onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <FaArrowLeft /> Back
                </button>

                {/* Privacy Policy Content */}
                <h1 style={{ 
                    color: '#00c4cc', 
                    fontSize: '2.5em', 
                    marginBottom: '20px',
                    textAlign: 'center'
                }}>
                    Privacy Policy
                </h1>

                <p style={{ 
                    color: '#666', 
                    fontSize: '0.9em', 
                    marginBottom: '40px',
                    textAlign: 'center',
                    fontStyle: 'italic'
                }}>
                    Last updated: December 08, 2025
                </p>

                <div style={{ lineHeight: '1.8', color: '#333' }}>
                    <section style={{ marginBottom: '30px' }}>
                        <p style={{ marginBottom: '15px' }}>
                            This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            We use Your Personal data to provide and improve the Service. By using the Service, You agree to the collection and use of information in accordance with this Privacy Policy. This Privacy Policy has been created with the help of the <a href="https://www.termsfeed.com/privacy-policy-generator/" target="_blank" rel="noopener noreferrer" style={{ color: '#00c4cc', textDecoration: 'underline' }}>Privacy Policy Generator</a>.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Interpretation and Definitions
                        </h2>
                        
                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Interpretation
                        </h3>
                        <p style={{ marginBottom: '15px' }}>
                            The words whose initial letters are capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.
                        </p>

                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Definitions
                        </h3>
                        <p style={{ marginBottom: '15px' }}>For the purposes of this Privacy Policy:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><p><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</p></li>
                            <li><p><strong>Affiliate</strong> means an entity that controls, is controlled by, or is under common control with a party, where "control" means ownership of 50% or more of the shares, equity interest or other securities entitled to vote for election of directors or other managing authority.</p></li>
                            <li><p><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Fluenci.</p></li>
                            <li><p><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</p></li>
                            <li><p><strong>Country</strong> refers to: New Jersey, United States</p></li>
                            <li><p><strong>Device</strong> means any device that can access the Service such as a computer, a cell phone or a digital tablet.</p></li>
                            <li><p><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</p></li>
                            <li><p><strong>Service</strong> refers to the Website.</p></li>
                            <li><p><strong>Service Provider</strong> means any natural or legal person who processes the data on behalf of the Company. It refers to third-party companies or individuals employed by the Company to facilitate the Service, to provide the Service on behalf of the Company, to perform services related to the Service or to assist the Company in analyzing how the Service is used.</p></li>
                            <li><p><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</p></li>
                            <li><p><strong>Website</strong> refers to Fluenci, accessible from <a href="http://localhost:3000/" rel="external nofollow noopener" target="_blank" style={{ color: '#00c4cc', textDecoration: 'underline' }}>http://localhost:3000/</a></p></li>
                            <li><p><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</p></li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Collecting and Using Your Personal Data
                        </h2>
                        
                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Types of Data Collected
                        </h3>

                        <h4 style={{ color: '#333', fontSize: '1.1em', marginTop: '15px', marginBottom: '10px' }}>
                            Personal Data
                        </h4>
                        <p style={{ marginBottom: '15px' }}>
                            While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:
                        </p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><p>Email address</p></li>
                            <li><p>First name and last name</p></li>
                            <li><p>Address, State, Province, ZIP/Postal code, City</p></li>
                            <li><p>Usage Data</p></li>
                        </ul>

                        <h4 style={{ color: '#333', fontSize: '1.1em', marginTop: '15px', marginBottom: '10px' }}>
                            Usage Data
                        </h4>
                        <p style={{ marginBottom: '15px' }}>
                            Usage Data is collected automatically when using the Service.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            Usage Data may include information such as Your Device's Internet Protocol address (e.g. IP address), browser type, browser version, the pages of our Service that You visit, the time and date of Your visit, the time spent on those pages, unique device identifiers and other diagnostic data.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            When You access the Service by or through a mobile device, We may collect certain information automatically, including, but not limited to, the type of mobile device You use, Your mobile device's unique ID, the IP address of Your mobile device, Your mobile operating system, the type of mobile Internet browser You use, unique device identifiers and other diagnostic data.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            We may also collect information that Your browser sends whenever You visit Our Service or when You access the Service by or through a mobile device.
                        </p>

                        <h4 style={{ color: '#333', fontSize: '1.1em', marginTop: '15px', marginBottom: '10px' }}>
                            Tracking Technologies and Cookies
                        </h4>
                        <p style={{ marginBottom: '15px' }}>
                            We use Cookies and similar tracking technologies to track the activity on Our Service and store certain information. Tracking technologies We use include beacons, tags, and scripts to collect and track information and to improve and analyze Our Service. The technologies We use may include:
                        </p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><strong>Cookies or Browser Cookies.</strong> A cookie is a small file placed on Your Device. You can instruct Your browser to refuse all Cookies or to indicate when a Cookie is being sent. However, if You do not accept Cookies, You may not be able to use some parts of our Service. Unless you have adjusted Your browser setting so that it will refuse Cookies, our Service may use Cookies.</li>
                            <li><strong>Web Beacons.</strong> Certain sections of our Service and our emails may contain small electronic files known as web beacons (also referred to as clear gifs, pixel tags, and single-pixel gifs) that permit the Company, for example, to count users who have visited those pages or opened an email and for other related website statistics (for example, recording the popularity of a certain section and verifying system and server integrity).</li>
                        </ul>
                        <p style={{ marginBottom: '15px' }}>
                            Cookies can be "Persistent" or "Session" Cookies. Persistent Cookies remain on Your personal computer or mobile device when You go offline, while Session Cookies are deleted as soon as You close Your web browser. You can learn more about cookies on <a href="https://www.termsfeed.com/blog/cookies/#What_Are_Cookies" target="_blank" rel="noopener noreferrer" style={{ color: '#00c4cc', textDecoration: 'underline' }}>TermsFeed website</a> article.
                        </p>
                        <p style={{ marginBottom: '15px' }}>We use both Session and Persistent Cookies for the purposes set out below:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li>
                                <p><strong>Necessary / Essential Cookies</strong></p>
                                <p>Type: Session Cookies</p>
                                <p>Administered by: Us</p>
                                <p>Purpose: These Cookies are essential to provide You with services available through the Website and to enable You to use some of its features. They help to authenticate users and prevent fraudulent use of user accounts. Without these Cookies, the services that You have asked for cannot be provided, and We only use these Cookies to provide You with those services.</p>
                            </li>
                            <li>
                                <p><strong>Cookies Policy / Notice Acceptance Cookies</strong></p>
                                <p>Type: Persistent Cookies</p>
                                <p>Administered by: Us</p>
                                <p>Purpose: These Cookies identify if users have accepted the use of cookies on the Website.</p>
                            </li>
                            <li>
                                <p><strong>Functionality Cookies</strong></p>
                                <p>Type: Persistent Cookies</p>
                                <p>Administered by: Us</p>
                                <p>Purpose: These Cookies allow us to remember choices You make when You use the Website, such as remembering your login details or language preference. The purpose of these Cookies is to provide You with a more personal experience and to avoid You having to re-enter your preferences every time You use the Website.</p>
                            </li>
                        </ul>
                        <p style={{ marginBottom: '15px' }}>
                            For more information about the cookies we use and your choices regarding cookies, please visit our Cookies Policy or the Cookies section of our Privacy Policy.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Additional Information We Collect (Fluenci-Specific)
                        </h3>
                        <p style={{ marginBottom: '15px' }}>
                            In addition to the Personal Data and Usage Data described above, when using Fluenci's influencer-business matching platform, we may also collect:
                        </p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><strong>Account Information:</strong> Name, email address, password, profile picture</li>
                            <li><strong>Profile Information:</strong> Gender, location, industry, background, personal website</li>
                            <li><strong>Social Media Information:</strong> Social media handles, follower counts, and connected accounts</li>
                            <li><strong>Business Information:</strong> Company details, offers, and collaboration preferences</li>
                            <li><strong>Communication Data:</strong> Messages sent through our platform</li>
                        </ul>
                        <p style={{ marginBottom: '15px' }}>
                            When you connect your social media accounts (Instagram, YouTube, Twitter/X, Facebook, etc.) through OAuth, we may access:
                        </p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li>Profile information (username, display name)</li>
                            <li>Follower/subscriber counts</li>
                            <li>Public content and posts (if permissions granted)</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Use of Your Personal Data
                        </h2>
                        <p style={{ marginBottom: '15px' }}>The Company may use Personal Data for the following purposes:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><p><strong>To provide and maintain our Service</strong>, including to monitor the usage of our Service.</p></li>
                            <li><p><strong>To manage Your Account:</strong> to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</p></li>
                            <li><p><strong>For the performance of a contract:</strong> the development, compliance and undertaking of the purchase contract for the products, items or services You have purchased or of any other contract with Us through the Service.</p></li>
                            <li><p><strong>To contact You:</strong> To contact You by email, telephone calls, SMS, or other equivalent forms of electronic communication, such as a mobile application's push notifications regarding updates or informative communications related to the functionalities, products or contracted services, including the security updates, when necessary or reasonable for their implementation.</p></li>
                            <li><p><strong>To provide You</strong> with news, special offers, and general information about other goods, services and events which We offer that are similar to those that you have already purchased or inquired about unless You have opted not to receive such information.</p></li>
                            <li><p><strong>To manage Your requests:</strong> To attend and manage Your requests to Us.</p></li>
                            <li><p><strong>For business transfers:</strong> We may use Your information to evaluate or conduct a merger, divestiture, restructuring, reorganization, dissolution, or other sale or transfer of some or all of Our assets, whether as a going concern or as part of bankruptcy, liquidation, or similar proceeding, in which Personal Data held by Us about our Service users is among the assets transferred.</p></li>
                            <li><p><strong>For other purposes</strong>: We may use Your information for other purposes, such as data analysis, identifying usage trends, determining the effectiveness of our promotional campaigns and to evaluate and improve our Service, products, services, marketing and your experience.</p></li>
                        </ul>
                        <p style={{ marginBottom: '15px' }}>Additionally, Fluenci uses the information we collect to:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li>Match influencers with businesses based on criteria</li>
                            <li>Facilitate communication between users</li>
                            <li>Display your profile information to other users</li>
                            <li>Improve our platform and develop new features</li>
                            <li>Prevent fraud and ensure platform security</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Retention of Your Personal Data
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            The Company will retain Your Personal Data only for as long as is necessary for the purposes set out in this Privacy Policy. We will retain and use Your Personal Data to the extent necessary to comply with our legal obligations (for example, if we are required to retain your data to comply with applicable laws), resolve disputes, and enforce our legal agreements and policies.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            The Company will also retain Usage Data for internal analysis purposes. Usage Data is generally retained for a shorter period of time, except when this data is used to strengthen the security or to improve the functionality of Our Service, or We are legally obligated to retain this data for longer periods.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Transfer of Your Personal Data
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            Your information, including Personal Data, is processed at the Company's operating offices and in any other places where the parties involved in the processing are located. It means that this information may be transferred to — and maintained on — computers located outside of Your state, province, country or other governmental jurisdiction where the data protection laws may differ from those from Your jurisdiction.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            Your consent to this Privacy Policy followed by Your submission of such information represents Your agreement to that transfer.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            The Company will take all steps reasonably necessary to ensure that Your data is treated securely and in accordance with this Privacy Policy and no transfer of Your Personal Data will take place to an organization or a country unless there are adequate controls in place including the security of Your data and other personal information.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Delete Your Personal Data
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            You have the right to delete or request that We assist in deleting the Personal Data that We have collected about You.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            Our Service may give You the ability to delete certain information about You from within the Service.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            You may update, amend, or delete Your information at any time by signing in to Your Account, if you have one, and visiting the account settings section that allows you to manage Your personal information. You may also contact Us to request access to, correct, or delete any personal information that You have provided to Us.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            Please note, however, that We may need to retain certain information when we have a legal obligation or lawful basis to do so.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Disclosure of Your Personal Data
                        </h2>
                        
                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Business Transactions
                        </h3>
                        <p style={{ marginBottom: '15px' }}>
                            If the Company is involved in a merger, acquisition or asset sale, Your Personal Data may be transferred. We will provide notice before Your Personal Data is transferred and becomes subject to a different Privacy Policy.
                        </p>

                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Law enforcement
                        </h3>
                        <p style={{ marginBottom: '15px' }}>
                            Under certain circumstances, the Company may be required to disclose Your Personal Data if required to do so by law or in response to valid requests by public authorities (e.g. a court or a government agency).
                        </p>

                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Other legal requirements
                        </h3>
                        <p style={{ marginBottom: '15px' }}>The Company may disclose Your Personal Data in the good faith belief that such action is necessary to:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li>Comply with a legal obligation</li>
                            <li>Protect and defend the rights or property of the Company</li>
                            <li>Prevent or investigate possible wrongdoing in connection with the Service</li>
                            <li>Protect the personal safety of Users of the Service or the public</li>
                            <li>Protect against legal liability</li>
                        </ul>

                        <h3 style={{ color: '#333', fontSize: '1.2em', marginTop: '20px', marginBottom: '10px' }}>
                            Sharing Your Information
                        </h3>
                        <p style={{ marginBottom: '15px' }}>We may share Your personal information in the following situations:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><strong>With Service Providers:</strong> We may share Your personal information with Service Providers to monitor and analyze the use of our Service, to contact You.</li>
                            <li><strong>For business transfers:</strong> We may share or transfer Your personal information in connection with, or during negotiations of, any merger, sale of Company assets, financing, or acquisition of all or a portion of Our business to another company.</li>
                            <li><strong>With Affiliates:</strong> We may share Your information with Our affiliates, in which case we will require those affiliates to honor this Privacy Policy. Affiliates include Our parent company and any other subsidiaries, joint venture partners or other companies that We control or that are under common control with Us.</li>
                            <li><strong>With business partners:</strong> We may share Your information with Our business partners to offer You certain products, services or promotions.</li>
                            <li><strong>With other users:</strong> when You share personal information or otherwise interact in the public areas with other users, such information may be viewed by all users and may be publicly distributed outside. On Fluenci, your profile information is visible to other users on the platform to facilitate matching and communication.</li>
                            <li><strong>With Your consent</strong>: We may disclose Your personal information for any other purpose with Your consent.</li>
                        </ul>
                        <p style={{ marginBottom: '15px', fontWeight: 'bold', color: '#e74c3c' }}>
                            We do NOT sell your personal information to third parties.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Security of Your Personal Data
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            The security of Your Personal Data is important to Us, but remember that no method of transmission over the Internet, or method of electronic storage is 100% secure. While We strive to use commercially reasonable means to protect Your Personal Data, We cannot guarantee its absolute security.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Your passwords are encrypted using industry-standard hashing algorithms. We use secure connections (HTTPS) to protect data in transit.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Your Rights and Choices
                        </h2>
                        <p style={{ marginBottom: '15px' }}>You have the right to:</p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li><strong>Access:</strong> Request access to your personal information</li>
                            <li><strong>Correction:</strong> Update or correct your information through your account settings</li>
                            <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                            <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                            <li><strong>Data Portability:</strong> Request a copy of your data in a portable format</li>
                            <li><strong>Disconnect Social Media:</strong> Disconnect your social media accounts at any time</li>
                        </ul>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            7. Cookies and Tracking Technologies
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            We use cookies and similar technologies to enhance your experience, analyze usage, and assist in marketing efforts. You can control cookies through your browser settings, but disabling cookies may limit some functionality.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            8. Third-Party Links
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            Our platform may contain links to third-party websites or services. We are not responsible for the privacy practices of these external sites. We encourage you to review their privacy policies.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            9. Children's Privacy
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            Our platform is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe we have collected information from a child, please contact us immediately.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Changes to this Privacy Policy
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.
                        </p>
                        <p style={{ marginBottom: '15px' }}>
                            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            Contact Us
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            If you have any questions about this Privacy Policy, You can contact us:
                        </p>
                        <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                            <li>By visiting this page on our website: <a href="http://localhost:3000/privacy-policy" rel="external nofollow noopener" target="_blank" style={{ color: '#00c4cc', textDecoration: 'underline' }}>http://localhost:3000/privacy-policy</a></li>
                        </ul>
                        <div style={{ 
                            backgroundColor: '#f8f9fa', 
                            padding: '20px', 
                            borderRadius: '6px',
                            marginTop: '15px'
                        }}>
                            <p style={{ marginBottom: '10px' }}>
                                <strong>Email:</strong> privacy@fluenci.com
                            </p>
                            <p style={{ marginBottom: '10px' }}>
                                <strong>Address:</strong> Fluenci Platform, Privacy Department
                            </p>
                            <p>
                                <strong>Phone:</strong> Available upon request
                            </p>
                        </div>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            14. California Privacy Rights
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information we collect, the right to delete your personal information, and the right to opt-out of the sale of personal information (we do not sell personal information).
                        </p>
                    </section>

                    <section style={{ marginBottom: '30px' }}>
                        <h2 style={{ color: '#00c4cc', fontSize: '1.5em', marginBottom: '15px' }}>
                            15. GDPR Rights (EU Users)
                        </h2>
                        <p style={{ marginBottom: '15px' }}>
                            If you are located in the European Economic Area (EEA), you have certain data protection rights under the General Data Protection Regulation (GDPR), including the right to access, rectify, erase, restrict processing, object to processing, and data portability. To exercise these rights, please contact us using the information provided above.
                        </p>
                    </section>

                    <div style={{ 
                        marginTop: '40px', 
                        padding: '20px', 
                        backgroundColor: '#e8f4f5', 
                        borderRadius: '6px',
                        textAlign: 'center'
                    }}>
                        <p style={{ margin: 0, color: '#666' }}>
                            By using Fluenci, you acknowledge that you have read and understood this Privacy Policy.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
