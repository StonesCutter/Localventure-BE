module.exports = {
  apps: [
    {
      name: "localventure-api",
      script: "./dist/index.js",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      },
      max_memory_restart: "256M",
      log_date_format: "YYYY-MM-DD HH:mm Z",
      shutdown_with_message: true,
      wait_ready: true,
      listen_timeout: 15000,
      kill_timeout: 5000
    }
  ]
};
