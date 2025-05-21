module.exports = {
  apps: [
    {
      name: "localventure-api",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork", // fork mode is generally better for single instance Node.js apps
      env: {
        NODE_ENV: "production"
      },
      max_memory_restart: "256M", // Restart if it exceeds this memory
      log_date_format: "YYYY-MM-DD HH:mm Z",
      wait_ready: true,        // Wait for process.send('ready')
      listen_timeout: 15000,   // Max time to wait for 'ready' signal (ms)
      kill_timeout: 5000,      // Max time to wait for graceful shutdown (ms)
      autorestart: true,       // Ensure PM2 attempts to restart on failure
      restart_delay: 5000,   // Delay before restarting (ms)
      // Optional: Specify log file paths if needed, though Railway often handles this
      // out_file: "/dev/null", // Or specific path like "./logs/out.log"
      // error_file: "/dev/null", // Or specific path like "./logs/error.log"
    }
  ]
};
