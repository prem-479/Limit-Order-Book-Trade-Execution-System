import gymnasium as gym
from stable_baselines3 import PPO
import os

# Create a folder for logs
log_dir = "./ppo_ant_tensorboard/"
os.makedirs(log_dir, exist_ok=True)

# 1. Initialize the Environment
env = gym.make("Ant-v5", render_mode="rgb_array")

# 2. Create the Model
# Added: device="cpu" to bypass the 1050 Ti compatibility issue
model = PPO("MlpPolicy", env, verbose=1, tensorboard_log=log_dir, device="cpu")

# 3. Start Learning
print("Training started on CPU... Check TensorBoard for progress!")
model.learn(total_timesteps=50000, tb_log_name="first_run")

# 4. Save
model.save("ppo_ant_model")
print("\nTraining complete! Model saved as ppo_ant_model.zip")
