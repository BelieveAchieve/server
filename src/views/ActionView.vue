<template>
  <div class="action">
    <p v-if="!isValidVerificationToken" class="message">
      This URL is no longer valid. Please check your inbox for the most recent
      verification email sent to you.
    </p>
  </div>
</template>

<script>
import OnboardingService from "@/services/OnboardingService";
import router from "@/router";
import AnalyticsService from "@/services/AnalyticsService";
import { EVENTS } from "@/consts";

/**
 * @todo UserService to choose starting onboarding step based on user state
 */
export default {
  data() {
    return {
      isValidVerificationToken: true
    };
  },
  mounted() {
    const { action } = this.$route.params;
    const { data } = this.$route.params;

    if (action === "verify") {
      OnboardingService.confirmVerification(this, data)
        .then(() => {
          this.$store.dispatch("user/firstDashboardVisit", true);
          this.$router.replace("/");
          AnalyticsService.captureEvent(EVENTS.ACCOUNT_VERIFIED, {
            event: EVENTS.ACCOUNT_VERIFIED
          });
        })
        .catch(() => (this.isValidVerificationToken = false));
    } else {
      router.replace("/");
    }
  }
};
</script>

<style lang="scss" scoped>
.message {
  width: 80%;
  font-size: 16px;
  margin: 30% auto 0;
  text-align: left;
}
</style>
