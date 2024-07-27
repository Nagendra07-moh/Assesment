/* eslint-disable react-native/no-inline-styles */
/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  View,
  Text,
  PermissionsAndroid,
  Alert,
  Button,
  StatusBar,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
  Modal,
  TouchableHighlight,
  TextInput,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import BackgroundService from 'react-native-background-actions';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {AnimatedCircularProgress} from 'react-native-circular-progress';
import {Surface, Divider} from 'react-native-paper';
const {height, width} = Dimensions.get('screen');
import AsyncStorage from '@react-native-async-storage/async-storage';

const App = () => {
  const clearData = async () => {
    try {
      await AsyncStorage.clear();
      console.log('All data cleared successfully');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };
  const clearDataForKey = async key => {
    try {
      await AsyncStorage.removeItem(key);
      console.log(`Data for key "${key}" has been cleared.`);
    } catch (error) {
      console.error(`Failed to clear data for key "${key}":`, error);
    }
  };
  async function requestNotificationPermission() {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        {
          title: 'Notification Permission',
          message: 'This app needs access to your notifications',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        },
      );
      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        // console.log('Push Notification Granted!!');
      } else {
        Alert.alert('Notification permission denied');
      }
    } catch (err) {
      console.warn(err);
    }
  }
  const onDisplayNotification = async () => {
    const channelId = await notifee.createChannel({
      id: 'default',
      name: 'Default Channel',
    });

    // Display a notification
    await notifee.displayNotification({
      title: 'Reminder!!!',
      body: 'Its Time To Drink Water!!',
      android: {
        channelId,
        pressAction: {
          id: 'default',
        },
      },
    });
  };
  const sleep = time =>
    new Promise(resolve => setTimeout(() => resolve(), time));
  const veryIntensiveTask = async taskDataArguments => {
    const {delay} = taskDataArguments;
    await new Promise(async resolve => {
      for (let i = 0; BackgroundService.isRunning(); i++) {
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const second = now.getSeconds();
        console.log(`${hours}:${minutes}:${second}`);
        if ((minutes === 59 || minutes === 30) && second === 0) {
          onDisplayNotification();
        }
        if (hours === 19 && minutes === 0 && second === 0) {
          clearDataForKey('DailyGoal');
          clearDataForKey('listData');
        }
        await sleep(delay);
      }
    });
  };
  const options = {
    taskName: 'Example',
    taskTitle: 'Hydration App is Running',
    taskDesc: 'will Remind you to drink water',
    taskIcon: {
      name: 'ic_launcher',
      type: 'mipmap',
    },
    color: '#ff00ff',
    linkingURI: 'yourSchemeHere://chat/jane', // See Deep Linking for more info
    parameters: {
      delay: 1000,
    },
  };

  const startBGService = async () => {
    await BackgroundService.start(veryIntensiveTask, options);
    await BackgroundService.updateNotification({
      taskDesc: 'We will Remind You To drink Water!!',
    });
  };
  const stopBGService = async () => {
    await BackgroundService.stop();
  };
  const setDailyGoal = async () => {
    setData('DailyGoal', JSON.stringify(totalWater));
    setDailyInput(false);
  };
  const getData = async key => {
    try {
      const value = await AsyncStorage.getItem(key);
      if (value !== null) {
        if (key === 'listData') {
          let Data = JSON.parse(value);
          setList(Data);
          let Total = 0;
          Data.forEach((item, index) => {
            Total += Number(item.amount);
          });
          setWater(Total);
        }
        if (key === 'DailyGoal') {
          setTotalWater(JSON.parse(value));
        }
      } else {
        console.log(totalWater);
        setDailyInput(true);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const checkFirstTimeOpen = async () => {
      try {
        const hasOpenedBefore = await AsyncStorage.getItem('hasOpenedBefore');
        if (!hasOpenedBefore) {
          startBGService();
          await AsyncStorage.setItem('hasOpenedBefore', 'true');
        }
      } catch (error) {
        console.error('Error checking first time open', error);
      }
    };

    checkFirstTimeOpen();
    requestNotificationPermission();
    getData('DailyGoal');
    getData('listData');
    // clearData();
  }, []);

  function calculatePercentage(x, Y) {
    if (Y === 0) {
      console.log('This is Zero->');
      return 0;
    }
    let res = Math.ceil((x / Y) * 100);
    setPersent(res);
  }

  // Background service and notification ends here!!
  const [water, setWater] = useState(0); // Drink so far
  const [totalWater, setTotalWater] = useState(0); //Total amount of water
  const [percent, setPersent] = useState(0);
  const [list, setList] = useState([]);
  const [inputModal, setInputModal] = useState(false);
  const [DailyInput, setDailyInput] = useState(false);
  const [waterInput, setWaterInput] = useState(0);
  const [circleColor, setCircleColor] = useState('red');

  const setData = async (key, value) => {
    try {
      await AsyncStorage.setItem(key, value);
      console.log('Data successfully saved');
    } catch (e) {
      console.error('Failed to save the data to the storage', e);
    }
  };
  const update = () => {
    setWater(prev => prev + 10);
  };

  //  add Water
  const addWater = () => {
    setInputModal(true);
  };
  const addToList = async () => {
    if (waterInput.length > 0) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const currentTime = JSON.stringify(hours) + ':' + JSON.stringify(minutes);
      const obj = {
        time: currentTime,
        amount: waterInput,
      };

      let arr = list;
      arr.push(obj);
      setList(arr);
      let amountSofar = water;
      amountSofar += Number(waterInput);
      console.log('This is amount so Far-->', amountSofar);
      calculatePercentage(amountSofar, totalWater);
      setWater(amountSofar);
      setWaterInput('');
      await setData('DailyWater', JSON.stringify(water));
      await setData('listData', JSON.stringify(list));
    }
    setInputModal(!inputModal);
  };

  const onAnimationComplete = () => {
    if (percent >= 80) {
      setCircleColor('#83E353');
    } else if (percent >= 40 && percent < 80) {
      setCircleColor('#159BFF');
    } else if (percent === 100) {
      Alert.alert('Congratulation You Have Achived Your Goal!!');
    }
  };

  return (
    <View style={styles.container}>
      <Surface style={styles.header} elevation={5}>
        <Text style={styles.headerText}>Water Reminder</Text>
      </Surface>
      <Surface elevation={5} style={styles.circleSurfaceStyle}>
        <AnimatedCircularProgress
          size={270}
          width={26}
          fill={percent}
          tintColor={circleColor}
          onAnimationComplete={onAnimationComplete}
          backgroundColor="#C9E4F7">
          {() => (
            <View style={styles.insideCircleView}>
              <View>
                <Text style={styles.insideCircleText}>
                  <Text
                    style={{color: '#159BFF', fontSize: 45, fontWeight: '600'}}>
                    {water}
                  </Text>
                  /{totalWater}ml
                </Text>
              </View>
              <View style={styles.dashStyle} />
              <View style={{width: 150}}>
                <Text style={{fontWeight: '600'}}>
                  completed<Text style={{color: '#159BFF'}}> {percent}%</Text>{' '}
                  of your Daily Target
                </Text>
              </View>
            </View>
          )}
        </AnimatedCircularProgress>
      </Surface>

      <TouchableOpacity
        onPress={addWater}
        style={{
          backgroundColor: '#159BFF',
          marginTop: 30,
          alignSelf: 'center',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingVertical: 15,
          borderRadius: 30,
        }}>
        <Text style={{color: 'white', fontSize: 20, fontWeight: 'bold'}}>
          Add Water
        </Text>
      </TouchableOpacity>

      <View style={{margin: 20, marginBottom: 0}}>
        <Text style={{fontSize: 20, color: '#159BFF', fontWeight: 'bold'}}>
          Today's Record
        </Text>
      </View>
      <ScrollView
        style={{
          backgroundColor: '#C9E4F7',
          margin: 10,
          borderRadius: 10,
          padding: 10,
        }}>
        {list &&
          list.map((item, index) => {
            return (
              <View key={index}>
                <View
                  style={{
                    flexDirection: 'row',
                    padding: 10,
                    alignItems: 'center',
                    justifyContent: 'c',
                  }}>
                  <Text style={styles.recordText}>Time: {item.time}</Text>
                  <Text style={[styles.recordText, {marginLeft: width * 0.25}]}>
                    Amount: {item.amount}ml
                  </Text>
                </View>
                <Divider style={{backgroundColor: 'white', height: 2}} />
              </View>
            );
          })}
      </ScrollView>

      {/* InputModal Starts here!! */}
      <Modal animationType="fade" transparent={true} visible={inputModal}>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Surface
            elevation={5}
            style={{
              backgroundColor: 'white',
              height: height * 0.2,
              width: width * 0.7,
              borderRadius: 20,
              padding: 10,
            }}>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{color: '#159BFF', fontSize: 18, fontWeight: 'bold'}}>
                How much water did you drink
              </Text>
            </View>
            <View>
              <TextInput
                style={{
                  height: 40,
                  borderColor: 'gray',
                  borderWidth: 1,
                  marginTop: 20,
                  borderRadius: 10,
                  marginHorizontal: 20,
                }}
                onChangeText={text => setWaterInput(text)}
                value={waterInput}
                placeholder="Enter in ml"
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                position: 'absolute',
                bottom: 20,
                alignItems: 'center',
              }}>
              <TouchableOpacity
                style={styles.btnStyle}
                onPress={() => {
                  addToList();
                }}>
                <Text
                  style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
                  Add
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnStyle}
                onPress={() => {
                  setInputModal(!inputModal);
                }}>
                <Text
                  style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </View>
      </Modal>
      <Modal animationType="fade" transparent={true} visible={DailyInput}>
        <View style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}>
          <Surface
            elevation={5}
            style={{
              backgroundColor: 'white',
              height: height * 0.2,
              width: width * 0.7,
              borderRadius: 20,
              padding: 10,
            }}>
            <View style={{justifyContent: 'center', alignItems: 'center'}}>
              <Text
                style={{color: '#159BFF', fontSize: 18, fontWeight: 'bold'}}>
                What is your Goal For Today
              </Text>
            </View>
            <View>
              <TextInput
                style={{
                  height: 40,
                  borderColor: 'gray',
                  borderWidth: 1,
                  marginTop: 20,
                  borderRadius: 10,
                  marginHorizontal: 20,
                }}
                onChangeText={text => setTotalWater(text)}
                value={totalWater}
                placeholder="Enter in milliliter"
              />
            </View>
            <View
              style={{
                flexDirection: 'row',
                position: 'absolute',
                bottom: 20,
                alignItems: 'center',
              }}>
              <TouchableOpacity
                style={styles.btnStyle}
                onPress={() => setDailyGoal()}>
                <Text
                  style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
                  Add
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnStyle}
                onPress={() => setDailyInput(false)}>
                <Text
                  style={{color: 'white', fontSize: 15, fontWeight: 'bold'}}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          </Surface>
        </View>
      </Modal>

      <StatusBar barStyle="light-content" backgroundColor="#159BFF" />
    </View>
  );
};

export default App;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FCFCFC',
  },
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    height: height * 0.06,
  },
  headerText: {
    color: '#159BFF',
    fontWeight: 'bold',
    fontSize: 23,
  },
  circleSurfaceStyle: {
    borderRadius: 100,
    alignItems: 'center',
    width: 200,
    justifyContent: 'center',
    marginLeft: width * 0.25,
    marginTop: height * 0.03,
  },
  insideCircleView: {
    flex: 1,
    backgroundColor: '#FCFCFC',
    width: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insideCircleText: {fontSize: 25, fontWeight: '600'},
  dashStyle: {
    borderTopWidth: 1,
    borderTopColor: 'gray',
    width: 150,
  },
  recordText: {
    color: '#159BFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  btnStyle: {
    marginLeft: 50,
    backgroundColor: '#159BFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
});
