import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

export default function DebugListings() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const listings = JSON.parse(localStorage.getItem('listings') || '[]');
    setData(listings);
  }, []);

  return (
    <ScrollView style={{ padding: 20 }}>
      {data.map(item => (
        <View key={item.id} style={{ marginBottom: 15 }}>
          <Text>ID: {item.id}</Text>
          <Text>Title: {item.title}</Text>
          <Text>Description: {item.description}</Text>
          <Text>Platform: {item.platform}</Text>
          <Text>----------</Text>
        </View>
      ))}
    </ScrollView>
  );
}
