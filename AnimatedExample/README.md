docker build -t animated-banner .
docker run -d -p 8080:80 animated-banner

docker build -t animated-shapes .
docker run -d -p 8081:80 animated-shapes


Then open test.html to see the results

