<script setup lang="ts"></script>

<template>
  <div
    class="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-center px-4 font-sans"
  >
    <h1 class="text-[10rem] leading-none font-black text-[#1e293b] poppins-text">404</h1>

    <p class="text-4xl font-bold text-[#1e293b] mt-2 mb-8">Page Not Found</p>

    <RouterLink
      to="/"
      class="inline-block vue-green-link text-xl font-medium hover:underline transition-all"
    >
      Go back home
    </RouterLink>
  </div>
</template>

<style scoped>
.poppins-text {
  font-family: 'Poppins', sans-serif;
  /* Ensure we use the ExtraBold weight you imported */
  font-weight: 800;
}
/* Applying the specific Vue Green color you requested.
  Using a scoped class ensures it matches your branding exactly.
*/
.vue-green-link {
  color: hsla(160, 100%, 37%, 1);
}

.vue-green-link:hover {
  /* Optional: slightly darker green on hover for better UX */
  color: hsla(160, 100%, 30%, 1);
}
</style>
