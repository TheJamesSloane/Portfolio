# CS50W CAPSTONE - DEAL OR NO DEAL SIMULATOR


## DATE OF SUBMISSION
31 December 2024


## DESCRIPTION
This project is a simulator of the popular television game show "Deal or No Deal". It was developed as a passion project, inspired by my exposure to the show whilst completing this course. Combining my love for mathematics and strategic thinking, I created my own version of the game to express my appreciation for the show through a unique interpretation. This project allows me to apply my skills in programming, game design, and decision-making models, providing an interactive experience that strives to mirror several of the game's mechanics.


## DISTINCTIVENESS AND COMPLEXITY
I believe that "Deal or No Deal Simulator" is sufficiently distinct and complex to satisfy the requirements of this submission, and I shall describe why here. "Deal or No Deal Simulator" is the only game that I have developed as part of this course, and it contains several elements completely unique to this submission. These unique features contribute to its complexity, and include:
* Togglable in-game music: This music changes from the main menu to the game interface and plays continuously unless the user switches it off. It is always set to "off" upon launch of the game to enhance user-friendliness, as unexpected sounds may overwhelm some users.
* Buttons that utilise transformation effects: This application features buttons creatively altered to enhance user-experience and functionality. In addition to the buttons in the launch and main menu screens which glow and become much larger when the user hovers over them, the game interface uses buttons altered to look like briefcases. The colour of these briefcases changes dynamically, indicating whether a briefcase has been opened or selected. This visual feedback helps users distinguish between opened briefcases, briefcases, and the one they have selected.
* Extensive calculations: Upon application launch or reload, dollar valuations are randomly assigned to briefcases, with the programme calculating the expected value of remaining briefcases. This is used to generate dynamic banker offers and determine whether counteroffers are accepted, ensuring that the game maintains both randomness and strategic depth.
* Multiple endpoints: The game accommodates multiple user decisions and outcomes. At nine milestones, the user is given up to three options: accept the banker's offer, decline and continue playing, or make a counteroffer. The user is unable to make a counteroffer if they have made one previously and had it declined. These options, along with dynamic mathematical calculations, influence the course of the game. Altogether, the game can end in several dozen ways, all of which had to be considered during development.
* Mobile-friendliness: This application supports use on devices with varying screen sizes, ensuring a smooth and consistent user experience across both mobile and desktop platforms.


## WHAT'S CONTAINED IN EACH FILE
The initial submission consists of two folders, a SQLite3 database file, a manage.py file, and this README.md document. The two main folders are as follows:
* "game" (Project Folder): This folder contains core project files, including settings.py and other configuration files essential for the game’s functionality.
* "deal" (Application Folder): This folder contains application-specific files, such as views.py and models.py, which define the structure and behaviour of the game.

The overall folder structure closely mirrors previous submissions, making it easy to navigate for those familiar with the format. Additionally:
*manage.py: Serves as an interface for managing administrative tasks, including running the development server and performing other management commands.
*SQLite3 File: Stores user data, including score-related information, allowing for persistent storage across sessions.


## INSTRUCTIONS ON RUNNING THE APPLICATION
This application is designed with a user-friendly interface, inspired by classic arcade-style games. All migrations have been performed prior to submission, so there is no need to run them again. To run the application, follow these steps:
1. Launch the server: Navigate to the main directory and run the following command to start the server: python manage.py runserver
2. Access the game: Once the server is running, open your browser and visit the provided URL to begin the game.
3. Navigate the main menu: After clicking "START", you will be presented with two options:
* "PLAY": Launch a new game.
* "HIGH SCORES": View the current high score records.
4. Follow in-game instructions: The game provides clear prompts at each stage, ensuring a smooth and intuitive user experience.


## FAIR USE DISCLAIMER
This application contains copyrighted material, including images and music from the "Deal or No Deal" show, which have not been specifically authorised by the copyright owner. The use of these materials in this project is intended solely for educational and non-commercial purposes, and is being done in a manner that I believe falls under "fair use" as defined in section 107 of the U.S. Copyright Law. This project will not generate direct financial benefit and was created solely for personal use and as a demonstration of programming skills. The materials used are publicly available on the internet and have been incorporated into the project with the intention of demonstrating the functionality of the game rather than exploiting the copyrighted content.