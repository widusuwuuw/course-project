import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, TextInput, Alert, Pressable } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { apiPut, apiDelete } from '@/api/client';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from 'App';
import AsyncStorage from '@react-native-async-storage/async-storage';


export default function AccountSettingsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isPasswordModalVisible, setPasswordModalVisible] = useState(false);
  const [isDeleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [deleteConfirmPassword, setDeleteConfirmPassword] = useState('');

  const [loading, setLoading] = useState(false);

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      Alert.alert('错误', '新密码和确认密码不匹配。');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('错误', '新密码长度不能少于6位。');
      return;
    }

    setLoading(true);
    try {
      await apiPut('/me/password', {
        current_password: currentPassword,
        new_password: newPassword,
      });
      setLoading(false);
      setPasswordModalVisible(false);
      Alert.alert('成功', '密码修改成功。');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('密码修改失败', error.message || '发生未知错误。');
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteConfirmPassword) {
      Alert.alert('错误', '请输入您的密码以确认删除。');
      return;
    }

    setLoading(true);
    try {
      await apiDelete('/me', { password: deleteConfirmPassword });
      setLoading(false);
      setDeleteModalVisible(false);
      await AsyncStorage.clear(); // Clear all local data
      navigation.replace('Register');
      Alert.alert('成功', '您的账户已成功删除。');
    } catch (error: any) {
      setLoading(false);
      Alert.alert('删除失败', error.message || '发生未知错误。');
    }
  };

  const dynamicStyles = {
    container: { backgroundColor: colors.backgroundSecondary },
    card: { backgroundColor: colors.backgroundCard },
    title: { color: colors.text },
    settingRow: { borderBottomColor: colors.border },
    settingText: { color: colors.text },
    deleteText: { color: colors.error },
    modalView: { backgroundColor: colors.backgroundCard },
    modalText: { color: colors.text },
    input: { 
      backgroundColor: colors.background, 
      color: colors.text,
      borderColor: colors.border,
    },
    button: { backgroundColor: colors.primary },
    buttonText: { color: colors.textWhite },
    deleteButton: { backgroundColor: colors.error },
  };

  return (
    <ScrollView style={[styles.container, dynamicStyles.container]}>
      <View style={styles.header}>
        <Text style={[styles.title, dynamicStyles.title]}>账户与安全</Text>
      </View>

      <View style={[styles.card, dynamicStyles.card]}>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]} onPress={() => setPasswordModalVisible(true)}>
          <Text style={[styles.settingText, dynamicStyles.settingText]}>修改密码</Text>
          <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, dynamicStyles.settingRow]}>
            <Text style={[styles.settingText, dynamicStyles.settingText]}>关联账户</Text>
            <Ionicons name="chevron-forward-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.settingRow, { borderBottomWidth: 0 }]} onPress={() => setDeleteModalVisible(true)}>
          <Text style={[styles.settingText, dynamicStyles.deleteText]}>删除账户</Text>
        </TouchableOpacity>
      </View>

      {/* Change Password Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isPasswordModalVisible}
        onRequestClose={() => setPasswordModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setPasswordModalVisible(false)}>
          <Pressable>
            <View style={[styles.modalView, dynamicStyles.modalView]}>
              <Text style={[styles.modalText, dynamicStyles.modalText]}>修改密码</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="当前密码"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="新密码"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="确认新密码"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity style={[styles.button, dynamicStyles.button]} onPress={handlePasswordChange} disabled={loading}>
                <Text style={[styles.buttonText, dynamicStyles.buttonText]}>{loading ? '保存中...' : '保存更改'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Account Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isDeleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setDeleteModalVisible(false)}>
          <Pressable>
            <View style={[styles.modalView, dynamicStyles.modalView]}>
              <Text style={[styles.modalText, dynamicStyles.modalText]}>确认删除账户</Text>
              <Text style={styles.modalWarningText}>此操作不可逆，您的所有数据都将被永久删除。请输入您的密码以确认。</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                placeholder="输入您的密码"
                placeholderTextColor={colors.textSecondary}
                secureTextEntry
                value={deleteConfirmPassword}
                onChangeText={setDeleteConfirmPassword}
              />
              <TouchableOpacity style={[styles.button, dynamicStyles.deleteButton]} onPress={handleDeleteAccount} disabled={loading}>
                <Text style={[styles.buttonText, dynamicStyles.buttonText]}>{loading ? '删除中...' : '确认删除'}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
  },
  card: {
    marginHorizontal: 24,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  deleteText: {
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  modalView: {
    margin: 20,
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: '90%',
  },
  modalText: {
    marginBottom: 16,
    textAlign: 'center',
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalWarningText: {
    marginBottom: 24,
    textAlign: 'center',
    fontSize: 16,
    color: '#6B7280',
    lineHeight: 22,
  },
  input: {
    width: '100%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    fontSize: 16,
  },
  button: {
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  deleteButton: {
    // defined in dynamicStyles
  },
});


