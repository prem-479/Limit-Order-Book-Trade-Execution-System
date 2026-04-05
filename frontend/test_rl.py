import gymnasium as gym
import time

try:
    env = gym.make("Ant-v5", render_mode="human")
    print(f"Action space: {env.action_space}")
    obs, info = env.reset()
    print("Environment reset successful!")
    
    # Render for a few seconds to verify the window opens
    for _ in range(100):
        env.render()
        env.step(env.action_space.sample())
    
    env.close()
    print("Test passed!")
except Exception as e:
    print(f"Error: {e}")
