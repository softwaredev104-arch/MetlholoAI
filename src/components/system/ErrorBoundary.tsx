import React, { Component, ErrorInfo, PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';

type State = { error: Error | null };

export class ErrorBoundary extends Component<PropsWithChildren, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('MetlholoAI fatal UI error', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <View style={styles.container}>
          <AppText variant="title2">MetlholoAI needs a restart</AppText>
          <AppText style={{ textAlign: 'center' }}>
            We hit an unexpected screen error.
          </AppText>
          <AppText variant="footnote" style={{ textAlign: 'center', opacity: 0.7 }}>
            {this.state.error.message}
          </AppText>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 },
});
