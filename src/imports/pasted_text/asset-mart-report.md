BSc (Hons) in Computer Science
Asset Mart – Smart IT Assets Management System
Contextual Report
Student Name: K.M.G.A. Saranga Thilakasiri
Student ID: 2527872
1
Table of Contents
1.Introduction .......................................................................................................................................................................................................................... 3
1.1 Project Background ...................................................................................................................................................................................... 3
1.2 Motivation .................................................................................................................................................................................................................. 4
1.3 Research Problem .......................................................................................................................................................................................... 4
Problem Statement .............................................................................................................................................................................................. 4
Why the Problem Exists ............................................................................................................................................................................ 4
1.4 Aim of the Project .......................................................................................................................................................................................... 5
1.5 Project Objectives .......................................................................................................................................................................................... 5
1.6 Description of the Artefact ................................................................................................................................................................ 5
Users of the Asset Mart System ...................................................................................................................................................... 6
1.7 Project Scope ........................................................................................................................................................................................................ 6
1.8 Proposed Solution Overview ........................................................................................................................................................ 6
1.9 Structure of the Report ............................................................................................................................................................................ 7
2. Literature Review ...................................................................................................................................................................................................... 7
2.1 Introduction to IT asset Management .............................................................................................................................. 7
2.2 Traditional IT Asset Management Systems ............................................................................................................ 8
2.3 Artificial Intelligence in Asset Management ........................................................................................................ 9
2.4 Predictive Maintenance and Data Mining Techniques .......................................................................... 9
2.5 Multimedia-Based Issue Reporting Systems ....................................................................................................10
2.6 Comparison of Existing Research Systems and the Proposed Asset Mart System ......................................................................................................................................................................................................................................10
2.7 Research Gap and Summary ......................................................................................................................................................12
3. Market Research ....................................................................................................................................................................................................12
3.1 Market Research Planning ............................................................................................................................................................12
3.2 Market Research Data Visualization..............................................................................................................................13
Other Departments (End Users) ................................................................................................................................................13
IT Department ........................................................................................................................................................................................................17
3.3 Market Research Conclusion ....................................................................................................................................................19
2
4. Project Plan ....................................................................................................................................................................................................................20
4.1 Project planning Overview ..........................................................................................................................................................20
4.2 Scrum-Based Work Breakdown Structure (WBS) ..................................................................................20
4.3 Gantt Chart and Project Schedule ......................................................................................................................................22
4.4 Project Tasks and Milestones ....................................................................................................................................................23
5. Planning the Artefact ........................................................................................................................................................................................23
5.1 Methodology Selection and Justification ..............................................................................................................23
5.2 System Requirements Analysis ..............................................................................................................................................24
5.2.1 Functional Requirements ....................................................................................................................................................25
5.2.2 Non-Functional Requirements ....................................................................................................................................25
5.3 System design ..................................................................................................................................................................................................26
5.4 Implementation plan ..............................................................................................................................................................................27
5.5 Testing and Evaluation Strategy ..........................................................................................................................................28
5.6 Risk Analysis and Mitigation Strategies ..................................................................................................................28
References ..........................................................................................................................................................................................................................29
Appendix ..............................................................................................................................................................................................................................31
Appendix B ................................................................................................................................................................................................................31
Appendix B ................................................................................................................................................................................................................34
3
1.Introduction
1.1 Project Background
Information Technology (IT) assets, including hardware, software and network infrastructure are essential to modern enterprises in order to facilitate business operations and accomplish strategic goals. The amount and complexity of IT assets have grown dramatically as businesses continue to implement digital transformation projects. To guarantee operational continuity, cost effectiveness, regulatory compliance and optimal use throughout their lives, these assets must be managed effectively. Nonetheless, a lot of business continue to use antiquated or only partially automated asset management techniques, which are insufficient for contemporary, data-driven settings.
Asset inventory and basic tracking features are the main focus of traditional IT asset management solutions. These systems frequently lack intelligence to support preventive maintenance plans, forecast possible problems, or evaluate asset usage patterns. Because of this, maintenance tasks are often reactive, taking care of problems only after they arise. Additionally, management’s capacity to make well-informed decisions about asset replacement, optimization and long-term planning is hampered by a lack of visibility into asset health and performance.
Ineffective communication between IT support teams and end users is another major problem with conventional asset management techniques. Mechanisms for reporting issues are usually restricted to text-based explanations, which may be unclear or inadequate to adequately characterize technical issues. This communication gap can have a detrimental effect on productivity and user happiness by delaying the identification and resolution of issues. Multimedia technologies are widely available, thus there is a chance to improve issue reporting by letting users submit pictures or videos that give reported issues more context.
New opportunities for enhancing IT asset management are presented by recent developments in web-based technologies, data mining and artificial intelligence (AI). Large amounts of asset related data can be analyzed by AI-driven systems to find reoccurring problems, spot abnormalities and produce insights for predictive maintenance. By anticipating possible issues before they arise, predictive maintenance helps businesses minimize downtime and prolong asset lifecycles. Furthermore, the creation of scalable, user-friendly platforms that enable safe access and real-time analytics is made easier by contemporary web frameworks.
In this regard, the Asset Mart project is presented as an intelligent, AI-driven IT asset management solution intended to get beyond the drawbacks of conventional methods. Asset Mart hopes to change traditional asset management into a proactive, insight-driven procedure that facilitates effective maintenance, enhanced communication and data-driven decision making by incorporating multimedia based issue reporting, predictive maintenance and analytics- driven dashboards.
4
1.2 Motivation
Motivation the increasing need for proactive and intelligent IT management solutions in contemporary businesses is the driving force behind this initiative. Current asset management systems frequently rely on reactive maintenance and text-based reporting, which can lead to misunderstandings and slow replies. Additionally, companies’ capacity to predict failures and maximize asset lifecycles is hampered by the underutilization of asset data.
There is a chance to create a system that tracks assets and offers useful insights thanks to developments in web technologies, data mining, and artificial intelligence. The desire to improve communication between IT department and end users while facilitating predictive maintenance through intelligent data analysis is the driving force behind this initiative.
1.3 Research Problem
Problem Statement
Many organizations still struggle with inefficiencies in maintaining and managing their IT assets, even after adopting IT asset management systems. With little support for intelligent analysis, proactive decision making and predictive maintenance, the majority of current systems primarily concentrate on asset registration and simple tracking. Reactive maintenance procedures, more downtime, higher operation expenses and restricted asset performance visibility are the outcomes of this. Furthermore, traditional text-based issue reporting frequently results in ambiguous problem descriptions, which slows down issue response and lower customer satisfaction in general.
Why the Problem Exists
The limits of traditional asset management systems and the underutilization of cutting-edge technology like artificial intelligence and data mining are major causes of these issues. Rather from being sophisticated, data-driven platforms, many systems are built as static record keeping tools. Effective analysis and insight production are hampered by the fragmentation of asset data across platforms. Additionally, the absence of multimedia-based reporting tools keeps users and IT administrators from communicating effectively, which exacerbates inefficiencies in problem-solving and maintenance procedures.
5
1.4 Aim of the Project
The aim of this project is to develop an AI powered web-based IT asset management system with user-driven issue reporting that improves maintenance effectiveness, facilitates predictive decision making through automation and intelligent data analysis and strengthens user and IT administrator communication.
1.5 Project Objectives
The key objectives of the project are,

 To identify data mining approaches the asset usage pattern generation.

 To develop a platform for user-driven issue reporting with the use of text, image, and video.

 To integrate existing third-party AI model to handle complaints and predict maintenance.

 To design and develop IT asset usage patterns using data mining.

 To test and evaluate the system.
1.6 Description of the Artefact
Asset Mart, the suggested artifact, is a web-based IT asset management system intended to facilitate effective and wise administration of corporate IT assets. End users and IT managers can communicate securely thanks to the system’s integrated platform.
While end users can browse assigned assets and report issues using text, photos and videos administrators will be able to register and manage assets, monitor reported issues and gain analytical insights thanks to Asset Mart’s role-based authentication feature. The goal of this multimedia-based reporting system is to shorten the time needed for defect diagnosis and enhance the clarity of issue reports.
The solution will incorporate a third-party artificial intelligence component to examine reported problems and asset data from the past. This makes it possible to find recurrent issues and create predictive maintenance insights, which help with proactive maintenance insights, which help with proactive maintenance choices. Analytics dashboards will also offer visual summaries of asset performance and maintenance trends, helping administrators manage assets with knowledge.
6
Users of the Asset Mart System
Role-based usage in an organizational setting is supported by the Asset Mart system. IT administrators are the major users they are in charge of registering and maintaining IT assets, keeping an eye on issues that have been reported and gaining access to analytics and insights from predictive maintenance. Administrators can use these tools to make well-informed decisions about lifecycle management, performance optimization and asset maintenance.
End users (employees) who are given IT resources for regular work tasks are also supported by the system. The clarity and accuracy of problem reporting are enhanced by end users’ ability to access their assigned assets and report faults using text, photos and videos. While guaranteeing safe and effective system functioning, this organized user model improves communication between users and IT managers.
1.7 Project Scope
The designed and implementation of a web-based system for managing IT assets in an organizational setting is the main emphasis of the project. Asset registration, issue reporting, predictive maintenance insights and analytics visualization are all included in the project. The system will integrate current third-party AI solutions hardware level fault detection and custom AI model training are outside its purview.
1.8 Proposed Solution Overview
The project offers an integrated, AI-enabled web-based solutions that blends user-centric design principles with intelligent data analysis to meet the defined research topic. In an organizational setting, Asset Mart is intended to serve as a consolidated platform that simplifies asset management, issue reporting and maintenance decision-making.
Proactive asset management is prioritized over reactive asset management in the suggested approach. When combined with multimedia inputs like photos and videos, user reported problems offer comprehensive contextual information that facilitates quicker and more precise problem diagnosis. A third-party artificial-intelligence component analyzes these inputs in conjunction with past asset usage and maintenance records to identify recurrent problems and produce predictive maintenance insights.
IT managers can track asset performance, see patterns and make well informed maintenance decisions thanks to the system’s integration of analytics dashboards and visual reporting tools.
7
1.9 Structure of the Report
Section 2. Literature Review - Existing research related to IT asset management, artificial intelligence, predictive maintenance, data mining and multimedia-based reporting systems. This section critically analyses relevant academic studies and identifies gaps in current approaches that justify the development of the proposed system.
Section 3. Market Research - Findings from surveys conducted with non-IT departments and IT professionals. The analysis of user feedback highlights current challenges, user expectations and practical requirements, ensuring that the proposed solution aligns with real organizational needs.
Section 4. Project Plan - Overall project management approach, including the use of Scrum methodology, work breakdown structure, Gantt chart, tasks and milestones used to manage the development process effectively.
Section 5. Planning the Artefact - Methodology selection, system requirements, design considerations, implementation plan, testing strategy and risk management activities involved in developing the Asset Mart system.
2. Literature Review
This review of the literature aims to investigate current research on multimedia based user interface systems, predictive maintenance, intelligent asset management and data mining methods. The evaluated research offers theoretical underpinnings as well as useful insights into how advanced analytics and artificial intelligence (AI) might improve asset performance, reliability and maintenance decision making. In order to discover current methods, constraints and research gaps that guide the creation of the suggested Asset Mart system, this system critically examines pertinent scholarly literature.
2.1 Introduction to IT asset Management
IT Asset Management (ITAM) is a methodical and structured strategy to managing an organization’s IT assets at every stage of their lifecycle, from deployment and acquisition to upkeep, optimization and disposal. Effective ITAM has become essential for guaranteeing service continuity, cost control, compliance and risk reduction as businesses depend more and more on digital infrastructures. According to “Mohan, V.N. et al. (2025) ‘Unpacking the enterprise asset management lifecycle in regulated environments’”, asset management systems that offer
8
traceability, auditability and lifecycle visibility are more important than basic asset inventories in today’s business environments, especially in regulated industries.
ITAM has clearly evolved from administrative record keeping tools to sophisticated, data-driven platforms, according to the literature. The availability of vast amounts of asset related data and the increasing complexity of IT infrastructures are the driving forces behind this trend. In addition to storing asset data, intelligent asset management systems are supposed to analyze asset behavior, facilitate predictive maintenance and allow for the well informed decision making. The suggested Asset Mart system is based on these ideas.
Figure 1: Asset Onboarding Configuration Parameters
2.2 Traditional IT Asset Management Systems
The major purpose of traditional IT asset management systems is to document asset information, including ownership, configuration, location and maintenance history. Although these systems offer some operational support, their capabilities are mainly restricted to manual reporting and static data storage. According to “Martinez-Galan et al. (2020), the lack of sophisticated analytics and decision support features in traditional platforms limits their applicability in intricate organizational settings.”
“Mohan (2025) goes on to say that relying on human data entry and sporadic updates frequently leads to information that is out of date or disjointed.” Because of this, asset breakdowns are usually fixed after they happen, which results in reactive maintenance plans, more downtime and grater operating expenses. Fault diagnosis is further slowed down by these systems’ poor support for user engagement, especially when it comes to issue reporting.
By incorporating analytics, AI-driven insights and improved user engagement, Asset Mart is intended to go beyond static tracking, in contrast to conventional systems covered in the literature. This allows for proactive maintenance and increased operational efficiency.
9
Figure 2: Top Features of Asset Management System
2.3 Artificial Intelligence in Asset Management
One of the most important technologies for improving asset management capabilities is artificial intelligence. According to “Dwivedi et al. (2019), AI is a transdisciplinary facilitator that facilitates automation, pattern recognition and predictive analytics in a variety of fields.” Artificial intelligence (AI) techniques in asset management enable systems to learn from past data. Identify abnormalities, and produce insights that assist lifetime and maintenance choices.
By continuously adjusting to operational conditions, clever learning algorithms enhance infrastructure reliability, as demonstrated by “Firoozi (2024)”. Additionally, “Martinez-Galan et al. (2020)” stress that AI-enabled intelligent asset management solutions platform better than conventional systems by offering actionable insights as opposed to descriptive reports.
Nonetheless, a large portion of current research concentrates on conceptual or analytical aspects of AI. Asset Mart sets itself apart by integrating AI directly in to a user facing online platform that supports predictive maintenance in a realistic organizational setting by combining real-world user reported data with AI-driven analysis.
2.4 Predictive Maintenance and Data Mining Techniques
Predictive maintenance uses real-time and historical data analysis to predict asset breakdowns before they happen. “Ghosh (2022) shows how proactive maintenance planning is made possible
10
by early fault detection made possible by machine learning based diagnostics.” In a similar vein, “Arunkumar (2024)” demonstrates how AI-based predictive maintenance techniques greatly increase dependability and decrease downtime in electrical and power network assets.
Predictive maintenance is made possible in large part by data mining techniques. Reliability analysis can be enhanced by using big data analytics to find hidden patterns in asset databases, as demonstrated by “Galar, Kans and Schmidt (2016) Cannarile et al. (2018)” aggregate assets with similar failure behaviors for targeted maintenance by applying clustering algorithms to reliability data. Combining several data mining approaches increases the accuracy of asset performance evaluation, according to “Ji Hui and Wang (2020).”
Although these studies show how successful predictive analytics can be, they frequently concentrate on analytical models alone. IT administrators may directly utilize data mining and predictive maintenance insights through dashboards and alerts thanks to Asset Mart’s unique integration of these approaches into an operational IT asset management solution.
2.5 Multimedia-Based Issue Reporting Systems
Efficient maintenance procedures depend on effective communication between technical support teams and end users. Conventional text-based issue reporting techniques frequently fall short in capturing enough contextual information, which can result in misunderstandings and a delayed resolution. “Kropfberger et al. (2007)” show that by using visual information like images and videos, multimedia based assistance systems greatly enhance problem understanding.
The results are quite applicable to corporate IT infrastructures, despite the fact that their research focused on consumer devices. Users may more precisely describe technical problems with multimedia inputs, which eliminates uncertainly and speeds up diagnosis.
The majority of study on asset management does not thoroughly examine user engagement. Asset Mart sets itself apart by directly merging AI-driven research with multimedia based issue reporting, enabling user submitted images and videos to aid in more precise defect diagnosis and predictive insights.
2.6 Comparison of Existing Research Systems and the Proposed Asset Mart System
Research Paper / System
Key Focus of the System
Limitations Identified in Literature
How Asset Mart Differs / Improves
Ghosh (2022) - AI & ML for
AI-driven fault prediction and
Focuses mainly on predictive models lacks
Asset Mart integrates AI-based predictive insights
11
Process Monitoring
diagnostics for industrial equipment
user interaction and asset lifecycle management
within a full IT asset lifecycle management platform with user interaction
Cannarile et al. (2018) - Reliability Data Clustering
Data mining and clustering for reliability analysis
Analytical focus only not implemented as a user-facing management system
Asset Mart applies data mining insights within a practical web-based asset management system
Ji Hui & Wang (2020) - Asset Performance Evaluation
Integrated data mining for asset performance assessment
Limited emphasis on real-time issue reporting and user communication
Asset Mart enhances performance evaluation using real-time, multimedia-based user issue reporting
Martínez-Galán et al. (2020) - IAMP Comparison Model
Evaluation framework for intelligent asset management platforms
Provides comparison criteria but does not propose a unified system
Asset Mart implements intelligent asset management features as a complete, working system
Kropfberger et al. (2007) - Multimedia Guidance System
Multimedia-based user guidance and problem reporting
Not integrated with asset management or predictive analytics
Asset Mart embeds multimedia reporting directly into IT asset management workflows
Mohan (2025) - Asset Management Lifecycle
Enterprise asset lifecycle management in regulated environments
Focuses on governance and compliance rather than intelligent automation
Asset Mart combines lifecycle management with AI-driven automation and analytics
Galar et al. (2016) - Big Data in Asset Management
Knowledge discovery from large asset datasets
Data-centric limited focus on end-user usability
Asset Mart balances big data analytics with user-friendly interfaces and dashboards
Firoozi & Firoozi (2024) - Intelligent Learning Algorithms
AI learning algorithms for smart infrastructure
Infrastructure-focused lacks multimedia issue reporting
Asset Mart adapts intelligent learning concepts to IT assets with enhanced reporting
12
2.7 Research Gap and Summary
The reviewed literature shows significant advancements in data mining, artificial intelligence, predictive maintenance and intelligent asset management. Previous research demonstrates how AI-driven analytics can enhance asset dependability, decrease downtime and aid in maintenance decision making. However, rather than focusing on comprehensive system integration, the majority of current research and actual systems treat these technological components separately, concentrating on particular analytical models or maintenance techniques. Because of this, there is a still little practical use of these technologies in actual organizational settings.
Specifically, little research has been done on combining lifecycle oriented asset management, multimedia based user issue reporting and AI-driven predictive analytics into a single web based platforms. Although data mining methods and predictive maintenance models have been thoroughly studied, user involvement and communication mechanisms are frequently disregarded. Because incomplete or erroneous issue reporting can have a detrimental influence on analytical and decision making processes, this divergence lowers the efficacy of intelligent systems.
This identified gap justifies the development of Asset Mart. The proposed system uniquely combines,

 AI-based predictive maintenance, enabling proactive identification of potential asset failures.

 Data mining-driven performance analysis, supporting accurate evaluation of asset usage and health.

 Multimedia enabled user issue reporting, improving communication between users and IT administrators.

 A centralized, web-based asset management system, ensuring accessibility, scalability and integration.
Asset Mart expands on current research and provides a useful, comprehensive solution for contemporary IT asset management by tackling both technical (like predictive analysis and data integration) and human centric (like communication and usability) issues. In addition to advancing scholarly understanding, this strategy offers firms looking for proactive and intelligent asset management solutions real benefits.
3. Market Research
3.1 Market Research Planning
The purpose of the market research for the Asset Mart Smart IT Asset Management System was to determine potential users' expectations and pain areas as well as the current state of IT asset
13
management inside the company. Two distinct online surveys were created, one aimed at employees in the IT department and the other at directors/management, finance, human resources, operations, and other support departments. This division allowed for the capturing of the perspectives of IT professionals who oversee and maintain the assets as well as end users who report IT problems.
Google Forms was used for both surveys since it provided for quick distribution, automated response gathering, and integrated graphical data summaries. In order to guarantee a sufficient number of participants for analysis, the links to the questionnaires were distributed via internal communication channels, and answers were gathered over a predetermined time frame. The primary source for data visualization and analysis in this part was the summary of google form document exported by Google Forms, which includes charts and response statistics for every question.
3.2 Market Research Data Visualization
Other Departments (End Users)
The results of the questionnaire that staff members of departments including management, finance, HR, operations, and other business divisions filled out are shown in this subsection. This survey was designed to assess how these users presently engage with IT resources and assistance and to pinpoint problems that Asset Mart needs to solve.
Figure 3: Users of other department
14
Figure X shows that the Operations department accounts for the bulk of responders (37.5%), with the Finance and Other departments each contributing 22.9%. The study mostly represents the opinions of operational and support workers who regularly use IT assets in day to day activities, as seen by the smaller percentage of participants from Directors/Management and Human Resources.
Figure 4: Reporting methods of IT assets issues
The majority of respondents presently report IT asset issues using conventional, unstructured channels, as shown in Figure X. The most popular way is email (91.7%), which is closely followed by phone calls (87.5%) and manual reporting methods like in person conversations or paper notes (66.7%). Only a small percentage use formal ticketing systems (14.6%), and none of the respondents said they used no reporting technique at all. This demonstrates that the company does not have a centralized, standardized platform for tracking and recording IT problems, which supports the requirement for an integrated system such as Asset Mart with an appropriate ticketing and reporting system.
15
Figure 5: Challenges of IT assets issues reporting
Respondents encounter a number of significant problems with the present IT issue reporting procedure, as shown in Figure X. Poor user-IT team communication (79.2%) and slow response times (75%) are the most frequent problems, followed by circumstances in which the IT team is unable to correctly identify the problem (58.3%). Only a small percentage of users reported inadequate tracking (6.3%) and no predictive insights (12.5%). These findings demonstrate that the current procedure does not deliver timely, unambiguous feedback or organized information sharing, which emphasizes the necessity for Asset Mart to provide standardized reporting, improved communication tools, and analytics-driven issue visibility.
Figure 6: Assets failures due to lack of maintenance
16
The majority of respondents affirm that asset breakdowns brought on by poor maintenance are a persistent problem in the company, as shown in Figure X. Only a very tiny percentage of respondents say that these failures are uncommon or never occur. The majority (58.3%) say that they happen occasionally, while another 29.2% say that they happen frequently. Asset Mart's AI-driven maintenance prediction and proactive asset management services are necessary because this trend indicates that preventive and predictive maintenance are not being adequately implemented.
Figure 7: User perception of multimedia issue reporting
Nearly all respondents clearly recognize the benefits of a system that facilitates multimedia-based issue reporting, as shown in Figure X. The vast majority of respondents (77.1%) think such a system would be extremely helpful, while the remaining 22.9% think it would be somewhat helpful. No respondents chose "not useful" or "not sure," which amply supports the inclusion of text, image, and video reporting options in Asset Mart.
17
Figure 8: User willingness to adopt an AI-powered asset management system
Figure X illustrates the respondents' significant desire to implement an AI-powered IT asset management solution that may enhance communication and decrease downtime. Users are usually receptive to intelligent, automated solutions like Asset Mart, as evidenced by the fact that 75% of participants said "yes," 25% said "maybe," and none said "not interested."
IT Department
The results of the second survey, which was directed at employees of the IT department who are in charge of overseeing the organization's hardware, software, and user support are presented in this subsection. Their answers are essential for comprehending operational and technological needs as well as the viability of cutting edge features like predictive maintenance.
18
Figure 9: Role of IT department
The respondents from the IT department represent a variety of technical roles, as shown in Figure X. IT Support/Technician employees make up the largest group (42.9%), followed by System Administrators (28.6%). IT Managers and Network Engineers each account for 14.3% of responses, suggesting that the survey gathers opinions from both operational support employees and infrastructure specialists who are directly involved in day-to-day asset management.
Figure 10: Assets recording & managing methods
19
The IT department now manages IT assets using a variety of tools and procedures, as shown in Figure X. All respondents (100%) report using a dedicated asset management system, but a very high proportion (85.7%) still rely on manual records such as spreadsheets and documents, and 42.9% use a partially automated system, while none indicated having no formal method. This implies that even while a system is in place, asset data is dispersed throughout several sources, underscoring the necessity of a single integrated platform like Asset Mart to centralize and simplify IT asset management.
Figure 11: Requirement of assets monitoring dashboard
Figure X shows that dashboard views and real-time asset monitoring are highly valued by IT personnel. Visual, real-time dashboards in Asset Mart are crucial for efficient IT asset management, as seen by the overwhelming majority (71.4%) rating these capabilities as very important, the remaining 28.6% selecting important, and no one selecting neutral or not important.
3.3 Market Research Conclusion
A more intelligent IT asset management system that benefits both end users and IT professionals is clearly needed, according to the combined results of the two surveys. While IT personnel emphasized the need for centralized data, analytics, and predictive capabilities to maximize maintenance and minimize downtime, non-IT personnel emphasized the significance of a user-friendly reporting interface with greater transparency.
The study made sure that the criteria were based on actual organizational needs by structuring the market research around two targeted Google Forms and analyzing the automatically generated summary charts in the word document. Asset Mart's scope and feature set, especially its
20
multimedia issue reporting, centralized asset tracking, AI-driven diagnostics, and predictive maintenance components, were directly influenced by these observations.
4. Project Plan
4.1 Project planning Overview
Project planning is essential to the timely and successful implementation of the Asset Mart system. Web-based system development, artificial intelligence integration, data mining methods and user interaction design are just a few of the interrelated components that make up the project. A flexible yet organized planning method that can handle changing requirements, technical uncertainly and iterative improvement is necessary to manage these components efficiently.
The Agile Scrum technique has been chosen as the main project management framework in order to address these issues. Scrum’s emphasis on gradual development, ongoing feedback and adaptability makes it especially appropriate for this project. Scrum allows features to be produced, reviewed and improved over several iterations or sprints, rather than trying to establish all system requirements at once. This strategy guarantees the sequential delivery of functional components and facilitates the early identification of risks.
A particular set of prioritized user stories that are developed from the overall system requirements are the focus of each project sprint reviews enable the assessment of finished features in relation to project objectives, sprint planning meetings are used to establish attainable targets. For innovations like multimedia based issue reporting and AI driven predictive maintenance, this iterative approach guarantees congruence between technical development and user expectations.
The project plan synchronizes Scrum activities with academic milestones and submission dates in addition to Agile principles. The project will continue to be both academically compliant and technically sound thanks to this hybrid planning method. All things considered, the chosen planning approach strikes a compromise between structure and flexibility, facilitating efficient time management, quality control, and the successful implementation of the Asset Mart system.
4.2 Scrum-Based Work Breakdown Structure (WBS)
The Asset Mart project is methodically broken down into manageable and well-defined units of work using the work Breakdown Structure (WBS). This project uses a Scrum based WBS, which is in line with Agile principles and encourages incremental and iterative development, in contrast to conventional waterfall based WBS models that depend on sequential stages.
Work is divided into epics, user stories and sprint tasks in a Scrum based WBS, allowing for flexible planning and ongoing prioritizing. This structure guarantees that intricate system
21
functionality is divided into manageable, smaller parts that can be put into practice, tested and evaluated in brief development cycles.
Figure 12: Scrum-Based Work Breakdown Diagram(Link)
22
4.3 Gantt Chart and Project Schedule
A Gantt chart is utilized to give a high level overview of the project time timeline, even though Scrum places a strong emphasis on flexible and iterative planning.
The project schedule includes,

 Scheduled start and end dates and sprint length.

 Relationships among the main epics.

 Important academic benchmarks like proposal submission, mid-project evaluation and final delivery.
Effective time management and progress tracking are made possible by this hybrid planning strategy, which blends the flexibility of scrum with the clarity of conventional scheduling methods.
Figure 13: Project Gantt Chart(Link)
23
4.4 Project Tasks and Milestones
To guarantee methodical progress monitoring and the timely completion of the Asset Mart project, project tasks and milestones are established. While milestones signify the successful completion of important project phases or deliverables, tasks reflect the discrete units of work necessary to construct the system. Tasks are produced from prioritized user stories and implemented incrementally within time boxed sprints in accordance with the Scrum methodology.
A set of precisely specified tasks, including as feature design, implementation, testing and refinement, are included in every sprint. To guarantee alignment with project objectives, tasks are planed during sprint planning meetings and assessed during sprint reviews. Effective workload management and early detection scheduling or technical issues are made possible by this task level planning.
When important system components and academic deliverables are finished, milestones are set. Completing requirements analysis and system design, delivering core asset management functions, successfully integrating AI based predictive maintenance features, and finishing system testing and evaluation are all significant benchmarks. These benchmarks guarantee compliance with academic submission deadlines and offer quantifiable measures of advancements.
Key milestones include,

 Project proposal approval and literature review completion.

 Completing the design documents and system requirements.

 The completion of essential system features.

 AI-based predictive maintenance features are successfully integrated.

 System testing and evaluation are finished.

 Submission in the project’s final artifact and report.
These milestones guarantee that the project stays in line with both technical goals and academic criteria and offer quantifiable signs of progress.
5. Planning the Artefact
5.1 Methodology Selection and Justification
In order to efficiently handle the technological complexity and changing needs associated with contemporary IT asset management systems, the Asset Mart artifact was developed using the Agile Scrum process. Web-based asset lifecycle management, multimedia based user issue reporting, predictive maintenance powered by artificial intelligence and analytics dashboards are just a few of the several components that are integrated into the suggested system. A conventional linear
24
development approach is less appropriate since these components bring uncertainties that are challenging to completely characterize at the early stages of development.
Scrum was chosen because of its focus on adaptability, frequent feedback and incremental progress. Scrum makes it possible to produce and assess the artifact in manageable chunks by structuring development into brief, time-boxed sprints. A functioning part of the system is delivered at each sprint, enabling early validation of essential features like asset registration and issue reporting before gradually integrating more sophisticated features like AI based predictive analytics. This iterative process helps identify technical or design problems early on and lowers the likelihood of late stage failures.
Additionally, Scrum facilitates efficient prioritization by using a product backlog, in which system needs are described as user stories and arranged according to dependency and value. This is especially crucial for the Asset Mart project since several aspects, including managing multimedia data and integrating AI, need to be tested and improved. Frequent sprint reviews and retrospectives offer chances to evaluate progress, take criticism into account and enhance development procedures.
Apart from its technological benefits, Scrum fits in nicely with the limitations of a final year academic project. It promotes structured documentation, permits alignment with academic milestones and submission dates and makes it possible to follow progress clearly through sprint goals and deliverables. All things considered, the choice of Scrum offers a well-rounded approach that promotes adaptability, quality control, and the effective delivery of a sophisticated, intelligent software artifact.
5.2 System Requirements Analysis
System requirements analysis, which outlines the anticipated behavior, capabilities and quality aspects of the suggested system, is a crucial stage in the planning of the Asset Mart artifact. The research topic, the projects goals, the results of the literature review and an examination of the shortcomings of the current IT asset management systems were used to determine the requirements. To guarantee that the system is technically sound, user centered and appropriate for actual organizational use, both functional needs were taken onto account.
These needs are stated as user stories and kept up to date inside a product backlog in accordance with the Scrum methodology. This guarantees traceability between project objectives and deployed system features while enabling requirements to be prioritized, improved and implemented incrementally across development sprints.
25
5.2.1 Functional Requirements
The essential characteristics and actions that the Asset Mart system must offer in order to facilitate efficient IT asset management are outlined in functional requirements. From the viewpoints of IT administrators and end users, these requirements outline what the system should be able to achieve.
Key functional requirements include,

 User Authentication and Role-Based Access Control
Role based access and secure user authentication will be supported by the system, enabling administrators and end users to access features pertinent to their responsibilities.

 Asset Registration and Lifecycle Management
Administrators will be able to register IT assets, document assets characteristics and monitor asset lifecycle stages, such as allocation, maintenance and retirement, using the system.

 Multimedia-Based Issue Reporting
In order to facilitate better problem detection and clearer communication, end users will be able to report asset related issues utilizing written descriptions, images and videos uploads.

 AI-Assisted Issue Analysis and Predictive Maintenance
In order to find reoccurring issues and produce predictive maintenance insights, the system will incorporate a third-party AI component to analyze previous asset data and reported issues.

 Analytics and Performance Monitoring Dashboards
Through interactive dashboards, administrators will be able to see visual data on asset performance, maintenance patterns and issue frequency.

 Issue Tracking and Resolution Management
To enhance maintenance workflows, the system will facilitate tracking of reported issues, status updates and resolutions.
By facilitating proactive asset management and improved user IT administrator contact, these functional requirements directly solve the highlighted research topic.
5.2.2 Non-Functional Requirements
The quality attributes and limitations that the Asset Mart system must function under are specified by non-functional requirements. These specifications guarantee the system’s dependability, usability and scalability.
Key non-functional requirements include,

 Usability
For both technical non-technical users, the system will offer an easy to use web interface that facilitates effective navigation and lowers the learning curve.
26

 Performance
The system must react quickly to user input, including data retrieval for analytics dashboards and multimedia uploads.

 Scalability
The system must be able to manage growing numbers of users, assets and historical data without experiencing performance degradation.

 Security
To safeguard sensitive asset information, the system must incorporate secure authentication, data access control and safe handling of submitted multimedia content.

 Reliability and Availability
During regular operation, core system functions must be accessible and system defects and failures must be handled appropriately.

 Maintainability
In keeping with the modular design and Scrum based development methodology, the system architecture will facilitate simple maintenance and future improvement.
5.3 System design
The goal of system design is to convert requirements onto a scalable and organized architecture. Asset Mart has a web based, modular architecture with loosely linked, individually modifiable system components.
The system is designed around key modules,

 User management and authentication

 Asset management and tracking

 Issue reporting and multimedia handling

 AI integration layer

 Analytics and visualization layer
Because individual modules may be implemented and improved over several sprints without impacting the system as a whole, this modular design facilitates Scrum based development. Use case diagrams, system architecture diagrams and data models are examples of design artifacts that are used to direct development and guarantee consistency.
27
5.4 Implementation plan
Scrum sprints are used to coordinate the artifact’s implementation, with each sprint producing a functional system increment. User stories are used to generate development tasks, which are then ranked according to project goals and system dependencies.
Typical sprint activities include,

 Sprint planning and task estimation

 Feature implementation and integration

 Unit and functional testing

 Sprint review and refinement
While advanced features like AI-driven predictive maintenance and analytics dashboards are addressed in later sprints, core system functionalities like asset management and issue reporting are developed in early sprints. Stable system growth and ongoing functionality validation are guaranteed by this phased approach.
Tools and Technologies Used for Asset Mart Development
Category
Tool / Technology
Purpose in Asset Mart System
UI/UX Design
Figma
Designing wireframes and UI prototypes to validate layout and usability before development
Frontend Development
HTML, CSS, JavaScript
Building the web-based user interface and implementing client-side interactions
Backend Development
Server-side web framework
Handling business logic, user authentication and asset management operations
Database
Relational Database (e.g. MySQL)
Storing asset records, user details, issue reports and maintenance history
Artificial Intelligence
Third-party AI service (API-based)
Generating predictive maintenance insights and analyzing reported issues
Data Visualization
Web-based charting libraries
Displaying analytics dashboards for asset performance and maintenance trends
Development Environment
Visual Studio
Writing, testing and debugging application code
28
Testing Tools
Browser developer tools
Functional testing, performance testing and UI validation
5.5 Testing and Evaluation Strategy
Instead of being viewed as a last stage, testing is included throughout the Asset Mart system's development lifecycle. Testing is done during each sprint in accordance with the Scrum methodology to verify newly added features and guarantee that system quality is maintained as development moves forward. This method of continuous testing lowers the possibility of eventual system breakdowns and facilitates the early detection of flaws.
The testing strategy includes,

 Functional Testing
confirms that each system feature such as asset registration, role-based access control, multimedia based issue reporting, and analytics dashboards operates in accordance with the designated functional criteria.

 Integration Testing
guarantees efficient system module interoperability, including database interfaces, third-party AI service integration, and frontend and backend components.

 Usability Testing
evaluates the system interface's usability, accessibility, and clarity, paying special attention to user issue reporting processes and administrator monitoring features.

 Performance Testing
evaluates how well the system responds, how well data is processed, and how multimedia uploads are handled under typical working circumstances.
The major goals of evaluation are to ascertain whether the artifact satisfies specified functional and non-functional requirements, enhances communication between end users and IT administrators, and supports predictive maintenance objectives through AI-driven insights. The results of the evaluation are utilized to confirm the efficacy of the system and direct any last adjustments before deployment.
5.6 Risk Analysis and Mitigation Strategies
A key part of artifact planning is risk management. AI integration difficulties, inconsistent data, time limits, and usability problems have all been cited as potential concerns for the Asset Mart project.
29
Mitigation strategies include,

 Using third-party, well-documented AI services

 Incremental feature development using Scrum sprints

 Regular progress reviews and backlog refinement

 Continuous testing and feedback integration
The project reduces interruptions and guarantees consistent progress toward successful artifact delivery by integrating risk mitigation into sprint planning.
Risk analyze
Risk ID
Risk Description
Impact Level
Mitigation Strategy
R1
System performance degradation due to high computational complexity during extensive data mining procedures
High
Optimize data mining algorithms, limit dataset size during early stages and consider cloud-based processing for scalability
R2
Data inconsistency or potential data loss caused by database errors
High
Perform regular database backups, enforce data validation rules and conduct routine integrity checks
R3
Insufficient or poor-quality training data affecting AI prediction accuracy
Medium
Use proven third-party AI models initially and continuously refine training datasets as more data becomes available
R4
Integration challenges with third-party AI services and APIs
Medium
Conduct early API testing, use prototyping and review integration documentation before full implementation
R5
Project delays due to scheduling constraints and academic deadlines
Medium
Follow structured Scrum sprints with clearly defined milestones and regular progress reviews
References
Cannarile, F. et al. (2018) 'A heterogeneous ensemble approach for the prediction of the remaining useful life of packaging industry machinery,' in A Clustering Approach for Mining Reliability Big Data for Asset Management, pp. 87–92. https://doi.org/10.1201/9781351174664-11.
30
Martínez-Galán, P. et al. (2020) 'A new model to compare intelligent asset management platforms (IAMP),' IFAC-PapersOnLine, 53(3), pp. 13–18. https://doi.org/10.1016/j.ifacol.2020.11.003.
Tusch, R. et al. (2008) 'Context-Aware UPNP-AV services for adaptive home multimedia systems,' International Journal of Digital Multimedia Broadcasting, 2008, pp. 1–12. https://doi.org/10.1155/2008/835438.
Arunkumar, G. (2024) 'AI-BASED PREDICTIVE MAINTENANCE STRATEGIES FOR ELECTRICAL EQUIPMENT AND POWER NETWORKS,' International Journal of Artificial Intelligence in Electrical Engineering (IJAIEE), 2(1), pp. 1–13. https://iaeme.com/MasterAdmin/Journal_uploads/IJAIEE/VOLUME_2_ISSUE_1/IJAIEE_02_01_001.pdf.
Dwivedi, Y.K. et al. (2019) 'Artificial Intelligence (AI): Multidisciplinary perspectives on emerging challenges, opportunities, and agenda for research, practice and policy,' International Journal of Information Management, 57, p. 101994. https://doi.org/10.1016/j.ijinfomgt.2019.08.002.
Galar, D., Kans, M. and Schmidt, B. (2016) 'Big Data in Asset management: knowledge discovery in asset data by the means of data mining,' in Lecture notes in mechanical engineering, pp. 161–171. https://doi.org/10.1007/978-3-319-27064-7_16.
Firoozi, Ali Akbar and Firoozi, Ali Asghar (2024) 'Intelligent Learning Algorithms for Smart Infrastructure,' in Intelligent Learning Algorithms for Smart Infrastructure, pp. 39–47. https://doi.org/10.1007/978-3-031-71097-1_5.
Sun, L. et al. (2020b) 'Edge-Cloud Computing and Artificial intelligence in Internet of Medical Things: architecture, Technology and Application,' IEEE Access, 8, pp. 101079–101092. https://doi.org/10.1109/access.2020.2997831.
Akinola, S. (2024) 'Trends in Open Source RDBMS: performance, scalability and security Insights,' Journal of Research in Science and Engineering, 6(7), pp. 22–28. https://doi.org/10.53469/jrse.2024.06(07).05.
Lu, Q. et al. (2019) 'From BIM towards Digital Twin: Strategy and future development for smart asset management,' in Studies in computational intelligence, pp. 392–404. https://doi.org/10.1007/978-3-030-27477-1_30.
Chen, Y. and Chen, G. (2022) 'Optimization of the intelligent asset Management system based on WSN and RFID technology,' Journal of Sensors, 2022, pp. 1–11. https://doi.org/10.1155/2022/3436530.
Campos, J. et al. (2017) 'A big data analytical architecture for the asset management,' Procedia CIRP, 64, pp. 369–374. https://doi.org/10.1016/j.procir.2017.03.019.
31
Liu, Y. and Song, P. (2022) 'An intelligent digital media asset management model based on business ecosystem,' Computational Intelligence and Neuroscience, 2022, pp. 1–14. https://doi.org/10.1155/2022/1190538.
Janiesch, C. et al. (2021) 'Machine learning and deep learning,' Electronic Markets, 31(3), pp. 685–695. https://doi.org/10.1007/s12525-021-00475-2.
Frey, F. et al. (2005) 'Digital asset management - a closer look at the literature,' RIT Scholar Works (Rochester Institute of Technology) [Preprint]. https://scholarworks.rit.edu/books/3.
Appendix
Appendix B
This appendix presents the questionnaire used to collect market research data from non-IT departments regarding IT asset usage, issue reporting practices and user expectations.
32
33
34
Appendix B
This appendix presents the questionnaire used to collect market research data from IT department staff, focusing on asset management practices, maintenance challenges and expectations for AI-driven predictive solutions.
35
36
37