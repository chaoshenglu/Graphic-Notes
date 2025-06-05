<template>
  <div class="auth-form">
    <h2>Register</h2>
    <form @submit.prevent="handleRegister">
      <div class="form-group">
        <label for="reg-username">Username:</label>
        <input type="text" id="reg-username" v-model="username" required />
      </div>
      <div class="form-group">
        <label for="reg-password">Password:</label>
        <input type="password" id="reg-password" v-model="password" required />
      </div>
      <div class="form-group">
        <label for="reg-confirm-password">Confirm Password:</label>
        <input
          type="password"
          id="reg-confirm-password"
          v-model="confirmPassword"
          required
        />
      </div>
      <div v-if="errorMessage" class="error-message">{{ errorMessage }}</div>
      <div v-if="successMessage" class="success-message">
        {{ successMessage }}
      </div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? "Registering..." : "Register" }}
      </button>
    </form>
    <p>
      Already have an account?
      <button @click="$emit('switchToLogin')" class="link-button">
        Login here
      </button>
    </p>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useNotesStore } from "../stores/notes";

const emit = defineEmits(["registerSuccess", "switchToLogin"]);
const notesStore = useNotesStore();

const username = ref("");
const password = ref("");
const confirmPassword = ref("");
const errorMessage = ref("");
const successMessage = ref("");
const isLoading = ref(false);

async function handleRegister() {
  if (password.value !== confirmPassword.value) {
    errorMessage.value = "Passwords do not match.";
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";
  successMessage.value = "";

  const success = await notesStore.register(username.value, password.value);
  isLoading.value = false;

  if (success) {
    successMessage.value = "Registration successful! You can now login.";
    // Optionally, you can emit an event to automatically switch to login
    // or clear the form, etc.
    // For now, just show a success message.
    username.value = ""; // Clear form
    password.value = "";
    confirmPassword.value = "";
    // emit('registerSuccess'); // If you want to auto-switch or similar
  } else {
    errorMessage.value =
      notesStore.error || "Registration failed. Please try again.";
  }
}
</script>

<style scoped>
.auth-form {
  max-width: 300px;
  margin: 20px auto;
  padding: 20px;
  border: 1px solid #ccc;
  border-radius: 8px;
  background-color: #f9f9f9;
}
.form-group {
  margin-bottom: 15px;
}
.form-group label {
  display: block;
  margin-bottom: 5px;
}
.form-group input {
  width: 100%;
  padding: 8px;
  box-sizing: border-box;
  border: 1px solid #ddd;
  border-radius: 4px;
}
button {
  padding: 10px 15px;
  background-color: #28a745; /* Green for register */
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  width: 100%;
}
button:disabled {
  background-color: #ccc;
}
.error-message {
  color: red;
  margin-bottom: 10px;
  font-size: 0.9em;
}
.success-message {
  color: green;
  margin-bottom: 10px;
  font-size: 0.9em;
}
p {
  margin-top: 15px;
  font-size: 0.9em;
  text-align: center;
}
.link-button {
  background: none;
  border: none;
  color: #007bff;
  text-decoration: underline;
  cursor: pointer;
  padding: 0;
  font-size: 1em;
  width: auto;
}
</style>
