
import time
import datetime
import requests

url = 'https://fb-latex-bot.herokuapp.com/';

while True:
	print("Request... at " + str(datetime.datetime.now()))
	r = requests.get(url)
	time.sleep(600) # 10 minutes
