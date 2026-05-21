import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useSession } from '@/hooks/useSession';
import { useParticipant } from '@/hooks/useParticipant';
import { useGuestAssignmentSession } from '@/hooks/useGuestAssignmentSession';
import { Colors } from '@/constants/Colors';

export default function Index() {
  const { session, loading: sessionLoading } = useSession();
  const { session: participantSession, loading: participantLoading } = useParticipant();
  const { session: assignmentSession, loading: assignmentLoading } = useGuestAssignmentSession();

  if (sessionLoading || participantLoading || assignmentLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color={Colors.brand.primary} size="large" />
      </View>
    );
  }

  if (session) return <Redirect href="/(tabs)/agenda" />;
  if (assignmentSession) return <Redirect href="/guest-event" />;
  if (participantSession) return <Redirect href="/guest-event" />;
  return <Redirect href="/(auth)/login" />;
}
