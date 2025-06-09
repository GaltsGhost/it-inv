

A full-stack web application designed for managing IT assets. It provides a clean user interface to create, read, update, and delete inventory items, and features a persistent database, a dark mode theme, and a barcode scanner input handler. The entire application is containerized with Docker for easy deployment.

![image](https://github.com/user-attachments/assets/5a9fd2f3-0271-402e-b04d-0bbaa38bdd12)


## Features

  * **Full CRUD Functionality**: Create, Read, Update, and Delete inventory items.
  * **Persistent Storage**: Uses a local SQLite database (`inventory.db`) to store all asset data.
  * **Modern UI**: A clean, responsive user interface built with React.js and styled with Tailwind CSS.
  * **Dark Mode**: A theme toggle allows users to switch between light and dark modes.
  * **Barcode Scanner Support**: The search bar and SKU form field can accept input directly from a USB barcode scanner.
  * **Containerized**: Includes a multi-stage `Dockerfile` for building a lean, production-ready image for easy deployment.

## Tech Stack

  * **Backend**:
      * Node.js
      * Express
      * SQLite3
      * CORS
  * **Frontend**:
      * React.js
      * Tailwind CSS
  * **Build Tools**:
      * Parcel
      * PostCSS

## Project Structure

```
IT Inventory/
├── dist/                # The final, optimized production files built by Parcel.
├── node_modules/        # Project dependencies.
├── src/                 # All application source code lives here.
│   ├── index.html       # The main HTML shell for the application.
│   ├── index.js         # The main JavaScript entrypoint containing all React components.
│   ├── input.css        # The source CSS file for Tailwind directives.
│   └── logo.svg         # The application logo.
├── .dockerignore        # Specifies files to exclude from the Docker build.
├── Dockerfile           # Instructions for building the Docker container.
├── inventory.db         # The SQLite database file (created on first run).
├── package.json         # Manages project dependencies and scripts.
├── server.js            # The Node.js/Express backend server.
└── ...
```

## Setup and Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd IT-Inventory
    ```
3.  **Install all dependencies:**
    This will install both the backend and frontend dependencies listed in `package.json`.
    ```bash
    npm install
    ```

## Running the Application

There are two primary ways to run this application: for local development or as a production Docker container.

### Local Development

This method is best for making changes to the code, as it provides live reloading. You will need two terminals.

1.  **Terminal 1: Start the Backend Server**

    ```bash
    node server.js
    ```

    The API will be running at `http://localhost:3000`.

2.  **Terminal 2: Start the Parcel Development Server**
    This command compiles the frontend code and enables hot-reloading.

    ```bash
    npm run start
    ```

    Access the development UI at the URL Parcel provides (usually `http://localhost:1234`).

### Production / Docker Deployment

This workflow builds the final, optimized application and runs it inside a Docker container.

1.  **Build the Production Files:**
    This command uses Parcel to compile and optimize all frontend assets into the `dist` folder.

    ```bash
    npm run build
    ```

2.  **Build the Docker Image:**
    This command uses the `Dockerfile` to create a portable image of your application.

    ```bash
    docker build -t your-name/it-inventory .
    ```

3.  **Run the Docker Container:**
    This command starts the container, maps port `8080` on your machine to port `3000` in the container, and uses a volume to persist the database.

    ```bash
    docker run -p 8080:3000 -v it_inventory_data:/app/data --name it-asset-manager your-name/it-inventory
    ```

4.  **Access the Application:**
    You can now access the application in your browser at `http://localhost:8080` or `http://<your-ip-address>:8080`.

## License

This project is licensed under the MIT License.
